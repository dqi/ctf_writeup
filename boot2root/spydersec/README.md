This is a writeup on the SpyderSec challenge VM by [@SpyderSec](https://twitter.com/SpyderSec)

Since it says in the description the challenge resides on a http server we can skip the nmap process this time and go straight to the site:

>```bash
>$ curl -I http://192.168.1.111
>HTTP/1.1 200 OK
>Date: Wed, 09 Sep 2015 11:54:26 GMT
>Server: Apache
>Set-Cookie: URI=%2Fv%2F81JHPbvyEQ8729161jd6aKQ0N4%2F; expires=Thu, 10-Sep-2015 11:54:26 GMT; path=/; httponly
>Connection: close
>Content-Type: text/html; charset=UTF-8
>```

The cookie appears to tell us where to look next...

>```
>$ curl -I http://192.168.1.111/v/81JHPbvyEQ8729161jd6aKQ0N4/
>HTTP/1.1 403 Forbidden
>Date: Wed, 09 Sep 2015 11:56:57 GMT
>Server: Apache
>Connection: close
>Content-Type: text/html; charset=iso-8859-1
>```

So there probaly is something hidden in this webdirectory.

There is a bese64 encoded image in the html source, but I have not managed to find an use for it. There is also a file Challenge.png in which we find a string:

>```
>35:31:3a:35:33:3a:34:36:3a:35:37:3a:36:34:3a:35:38:3a:33:35:3a:37:31:3a:36:34:3a:34:35:3a:36:37:3a:36:61:3a:34:65:3a:37:61:3a:34:39:3a:33:35:3a:36:33:3a:33:30:3a:37:38:3a:34:32:3a:34:66:3a:33:32:3a:36:37:3a:33:30:3a:34:61:3a:35:31:3a:33:64:3a:33:64
>```

Which hex decodes to:

>```
>51:53:46:57:64:58:35:71:64:45:67:6a:4e:7a:49:35:63:30:78:42:4f:32:67:30:4a:51:3d:3d
>```

Once more:

>```
>QSFWdX5qdEgjNzI5c0xBO2g0JQ==
>```

This is obviously base64:

>```
>$ base64 -d <<< QSFWdX5qdEgjNzI5c0xBO2g0JQ==
>A!Vu~jtH#729sLA;h4%
>```

I tought this might need some further decoding, but it turns out we are done with this string.

On the main page we find some obfuscated javascript:

>```javascript
>eval(function (p, a, c, k, e, d) {
>  e = function (c) {
>    return c.toString(36)
>  };
>  if (!''.replace(/^/, String)) {
>    while (c--) {
>      d[c.toString(a)] = k[c] || c.toString(a)
>    }
>    k = [
>      function (e) {
>        return d[e]
>      }
>    ];
>    e = function () {
>      return '\\w+'
>    };
>    c = 1
>  };
>  while (c--) {
>    if (k[c]) {
>      p = p.replace(new RegExp('\\b' + e(c) + '\\b', 'g'), k[c])
>    }
>  }
>  return p
>}('7:0:1:2:8:6:3:5:4:0:a:1:2:d:c:b:f:3:9:e', 16, 16, '6c|65|72|27|75|6d|28|61|74|29|64|62|66|2e|3b|69'.split('|'), 0, {
>}))
>```

For which I found a tool online to deobfuscate it: [here](http://matthewfl.com/unPacker.html)

After running it trough:

>```
>61:6c:65:72:74:28:27:6d:75:6c:64:65:72:2e:66:62:69:27:29:3b
>```

Which is ascii-hex encoded for: 

>```
>alert('mulder.fbi');
>```

Which is a file in our previously found directory

>```bash
>$ wget 192.168.1.111/v/81JHPbvyEQ8729161jd6aKQ0N4/mulder.fbi
><snip>
>$ file mulder.fbi 
>mulder.fbi: ISO Media, MPEG v4 system, version 2
>```

I spend quite some time trying to anylize the audio (spectograms/fldigi) and frames (Stegsolver/Steganabara) of this file. Then I watched a part of the X-Files episode "Kill Switch" (it is terrible but funny) because of all the references to it in this challenge - this got me nowhere. Then I tried the tool OpenPuff with "A!Vu~jtH#729sLA;h4%" as the password, still nothing. Further looking for encrypted/hidden data in video files finally led me to [here](http://oskarhane.com/hide-encrypted-files-inside-videos/).

After mounting the file as a truecrypt volume, with password A!Vu~jtH#729sLA;h4% there is a single file in the mounted volume: Flag.txt:

>```>
>$ cat /media/truecrypt1/Flag.txt 
>Congratulations! 
>
>You are a winner. 
>
>Please leave some feedback on your thoughts regarding this challenge� Was it fun? Was it hard enough or too easy? What did you like or dislike, what could be done better?
>
>https://www.spydersec.com/feedback
>```


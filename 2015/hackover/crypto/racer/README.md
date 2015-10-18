## Hackover CTF: Racer

----------
## Challenge details
| Contest        | Challenge     | Category  | Points |
|:---------------|:--------------|:----------|-------:|
| Hackover CTF | Racer | Crypto | 300  |


*Description*
> Join the race and make a round. Don't forget to view the winner animation!

----------
## Write-up

For this challenge we need to choose Red/Blue correct about 40 times in a row to win a race, if we get it wrong at any time we are moved back to the beginning. So we need to figure out something to base our choice on.

We can download a 'pills' file, in which there are 2048 files of appearantly random data.

In the source code we find:

>```go
>	var fn func([]byte)
>	if s.GetColor() == "red" {
>		fn = fillRc4
>	} else {
>		fn = fillRandom
>	}
>	w.Header().Set("Content-Type", "application/x-gtar")
>	buildArchive(w, fn)
>}
>
>func buildArchive(w io.Writer, fillRandom func([]byte)) {
>	size := 16
>	randombytes := make([]byte, size)
>	z := gzip.NewWriter(w)
>	tw := tar.NewWriter(z)
>	createTime := time.Now()
>	for i := 0; i < NUM_CHEMICALS; i++ {
>		tw.WriteHeader(&tar.Header{Name: CHEMICALS[i],
>			Mode:     0666,
>			Uid:      1000,
>			Gid:      1000,
>			Size:     int64(size),
>			ModTime:  createTime,
>			Typeflag: tar.TypeReg,
>		})
>		if i == 42 {
>			tw.Write(HINT)
>		} else {
>			fillRandom(randombytes)
>			tw.Write(randombytes)
>		}
>	}
>	tw.Close()
>	z.Close()
>}
>```

This reveals that if the we need to choose "Red" the data is actully RC4 encrypted. 

>```
>the second output byte of the cipher was biased toward zero with probability 1/128 (instead of 1/256)
>```

Thus we can distinguish the pills file:

>```python
>#!/usr/bin/python
>
>import os
>import tarfile
>import shutil
>
>tfile = tarfile.open("pills.tar.gz", 'r:gz')
>tfile.extractall('./pills')
>
>count = 0
>for filename in os.listdir("./pills"):
>    with open("pills/" + filename, 'rb') as f:
>        f.read(1)
>        byte = f.read(1)
>        if byte == "\x00":
>            count += 1
>print count
>if count < 8:
>    print "Seems random? -> blue"
>if count > 16:
>    print "Seems RC4? -> red"
>
>shutil.rmtree("./pills")
>```

Thankfully we can redownload the file and we get a different one.

The flag was something like (I didn't write it down):

>```
>hackover15{juprc4istotallybroken}
>```

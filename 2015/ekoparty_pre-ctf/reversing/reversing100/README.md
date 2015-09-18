## ekoparty_pre-ctf: reversing100

----------
## Challenge details
| Contest        | Challenge     | Category  | Points |
|:---------------|:--------------|:----------|-------:|
| ekoparty_pre-ctf | MOV | Reversing | 100  |


*Description*
> Find the flag through the obscure code 

----------
## Write-up

We are given a mov-usacted binary. My first tought was to use pintools to count instructions and get the input we need that way, but there was no real difference in instruction count for different inputs.

Lets try something else; in the binary strings we find: "Processing...\n", it is loaded at 0x0804A2D8. I thought there might be some reference to what our input is compared to close to this address so lets put a breakpoint:

>```
>$ gdb -q MOV
>Reading symbols from MOV...(no debugging symbols found)...done.
>gdb-peda$ b *0x0804A2D8
>Breakpoint 1 at 0x804a2d8
>gdb-peda$ r
>Starting program: MOV 
>        __                              __          
>  ____ |  | ______ ___________ ________/  |_ ___.__.
>_/ __ \|  |/ /  _ \\____ \__  \\_  __ \   __<   |  |
>\  ___/|    <  <_> )  |_> > __ \|  | \/|  |  \___  |
> \___  >__|_ \____/|   __(____  /__|   |__|  / ____|
>     \/     \/     |__|       \/             \/     
>
>[----------------------------------registers-----------------------------------]
>EAX: 0x83f6650 --> 0x85f6664 ("All_You_Need_Is_m0v")
>EBX: 0x8000 
>ECX: 0x0 
>EDX: 0x85f6664 ("All_You_Need_Is_m0v")
>ESI: 0xffffd24c --> 0xffffd41c ("XDG_VTNR=7")
>EDI: 0x804827c (mov    DWORD PTR ds:0x83f6660,esp)
>EBP: 0x0 
>ESP: 0x85f6660 --> 0x804d420 ("     \\/     \\/     |__|       \\/", ' ' <repeats 13 times>, "\\/     \n\n")
>EIP: 0x804a2d8 (mov    eax,0x804d411)
>EFLAGS: 0x202 (carry parity adjust zero sign trap INTERRUPT direction overflow)
>[-------------------------------------code-------------------------------------]
>   0x804a2c9:	mov    eax,DWORD PTR [edx*4+0x83f6690]
>   0x804a2d0:	mov    edx,DWORD PTR ds:0x81f6630
>   0x804a2d6:	mov    DWORD PTR [eax],edx
>=> 0x804a2d8:	mov    eax,0x804d411
>   0x804a2dd:	mov    ds:0x804d57c,eax
>   0x804a2e2:	mov    eax,ds:0x804d57c
>   0x804a2e7:	mov    eax,eax
>   0x804a2e9:	mov    ds:0x81f6630,eax
>[------------------------------------stack-------------------------------------]
>0000| 0x85f6660 --> 0x804d420 ("     \\/     \\/     |__|       \\/", ' ' <repeats 13 times>, "\\/     \n\n")
>0004| 0x85f6664 ("All_You_Need_Is_m0v")
>0008| 0x85f6668 ("You_Need_Is_m0v")
>0012| 0x85f666c ("Need_Is_m0v")
>0016| 0x85f6670 ("_Is_m0v")
>0020| 0x85f6674 --> 0x76306d ('m0v')
>0024| 0x85f6678 --> 0x0 
>0028| 0x85f667c --> 0x0 
>[------------------------------------------------------------------------------]
>Legend: code, data, rodata, value
>
>Breakpoint 1, 0x0804a2d8 in ?? ()
>gdb-peda$ 
>```

Well... could it be that simple after everything i tried with pintools...?

>```
>$ ./MOV All_You_Need_Is_m0v
>        __                              __          
>  ____ |  | ______ ___________ ________/  |_ ___.__.
>_/ __ \|  |/ /  _ \\____ \__  \\_  __ \   __<   |  |
>\  ___/|    <  <_> )  |_> > __ \|  | \/|  |  \___  |
> \___  >__|_ \____/|   __(____  /__|   |__|  / ____|
>     \/     \/     |__|       \/             \/     
>
>Processing...
>Congrats!
>This is the flag you are looking for: EKO{All_You_Need_Is_m0v}
>```

Oh dear. Lesson learned.

The flag is:

>```
>EKO{All_You_Need_Is_m0v}
>```

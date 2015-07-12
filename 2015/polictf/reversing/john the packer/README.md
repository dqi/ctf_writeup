# polictf: John the Packer

----------
## Challenge details
| Contest        | Challenge     | Category  | Points |
|:---------------|:--------------|:----------|-------:|
| polictf | John the Packer | Reversing |    350 |

>**John's greatest skill is to pack everything and everywhere with everyone. He doesn't want that someone reverse his super secret program. So he wrote a magic packing system. Can you show to John that his packing system is not a good anti->reversing solution? N.B. Unfortunately John The Packer has multiple solution, so if you have a solution that is not accepted by the scoreboard (but is accepted by the binary) please contact an OP on IRC**

----------

## Write-up
### Reversing

Fire up IDA, close to the entry point we see 

>```asm
>.text:08048633                 push    eax
>.text:08048634                 mov     edx, [edx]
>.text:08048636
>.text:08048636 loc_8048636:                            ; CODE XREF: .text:0804863Cj
>.text:08048636                 xor     [eax], edx
>.text:08048638                 add     eax, 4
>.text:0804863B                 dec     ecx
>.text:0804863C                 jnz     short loc_8048636
>.text:0804863E                 pop     eax
>.text:0804863F                 call    eax
>.text:08048641                 sub     esp, 8
>.text:08048644                 push    dword ptr [ebp+0Ch]
>.text:08048647                 push    dword ptr [ebp+8]
>.text:0804864A                 call    sub_804859B
>```

So, this unpacks the function pointed at by EAX, and then calls it, after it returns we go to sub_804859B, lets see what we have there.

So there we find the repacking loop:

>```asm
>.text:080485D3 loc_80485D3:                            ; CODE XREF: sub_804859B+3Ej
>.text:080485D3                 xor     [ebx], edx
>.text:080485D5                 add     ebx, 4
>.text:080485D8                 dec     ecx
>.text:080485D9                 jnz     short loc_80485D3
>```

So to get the unpacked binary we just NOP out the repack instruction at 080485D3, place a breakpoint at 0804863F and run it until all the functions are unpacked. Then we can use GDB-PEDA to get a memory dump of the unpacked binary. (dumpmem out all). Then to get a runnable binary we also have to NOP out the unpacking loop, because else it will try to unpack something that is not packed and crash at 0804863F.

Now that we have an unpacked readable binary we can see that the flag is checked in 3 parts. At sub_8048A42, sub_80489A9 and sub_804890B.

## sub_8048A42

Here we have:

>```asm
>.text:08048A84                 cmp     ebx, eax
>.text:08048A86                 jz      short loc_8048A8F
>.text:08048A88                 mov     eax, 0
>.text:08048A8D                 jmp     short loc_8048AA0
>```

To get the first part of the flag we can place a breakpoint at 08048A84 and see our input (in EBX) being compared to flagletters (in EAX), this gives us the first part of the flag: flag{packer...}

## sub_80489A9

The second part of the flag is checked here:

>```asm
>.text:08048A06                 test    eax, eax        ; comes from sub_08048813
>.text:08048A08                 jnz     short loc_8048A11
>.text:08048A0A                 mov     eax, 0
>.text:08048A0F                 jmp     short loc_8048A3A
>```

Now here we can see the same pattern, we need EAX to be 1 to pass the check. Now here the value in EAX comes from sub_08048813, which takes the next input character and does some strange floating-point magic on it. I solved this part by placing a breakpoint on 08048A06 and just try different characters until EAX == 1, this worked untill: flag{packer-15-4-?41=-}

## sub_804890B

The last part of the check looks like this:

>```asm
>.text:0804896F                 cmp     al, [ebp+var_E]
>.text:08048972                 jz      short loc_804897B
>.text:08048974                 mov     eax, 0
>.text:08048979                 jmp     short loc_80489A4
>```

So by now we know the drill, place a breakpoint at 0804896F, and copy the flag char-by-char from the register.

The flag is flag{packer-15-4-?41=-in-th3-4ss}



# polictf: reversemeplz

----------
## Challenge details
| Contest        | Challenge     | Category  | Points |
|:---------------|:--------------|:----------|-------:|
| polictf | Reversemeplz | Reversing |    200 |

**Description:**
>*Last month I was trying to simplify an algorithm.. and I found how to mess up a source really really bad. And then this challenge is born. Maybe is really simple or maybe is so hard that all of you will give up. Good luck!*

----------
## Write-up
### Reversing

After loading the binary in IDA the relavant check in pseudocode (with some annotations) looks like this:

>```c
>int __cdecl check_input(char *flag)
>{
>  signed int mustBeZero; // edi@1
>  int stringIndex; // esi@1
>  char v3; // al@6
>  int v4; // eax@10
>  char v6; // dl@16
>  char i; // al@16
>  char v8; // [sp+3h] [bp-59h]@13
>  char v9; // [sp+4h] [bp-58h]@6
>  char v10; // [sp+5h] [bp-57h]@16
>  int v11; // [sp+10h] [bp-4Ch]@13
>  char v12; // [sp+14h] [bp-48h]@1
>
>  qmemcpy(&v12, &unk_8048960, 60u);
>  mustBeZero = 0;
>  stringIndex = 0;
>  do
>  {
>    if ( flag[stringIndex] <= 0x60 )            // it is not a lowercase letter
>      flag[stringIndex] = sub_8048519(flag[1] & 1);
>    if ( flag[stringIndex] > 0x7A )             // it is {|}~DEL
>      flag[stringIndex] = sub_8048519(flag[1] & 2);
>    v3 = sub_8048519(flag[stringIndex]);
>    *(&v9 + stringIndex) = v3;
>    if ( v3 != 207 && (unsigned __int8)v3 > 0xCCu )
>      mustBeZero = 1;                           // fail
>    ++stringIndex;
>  }
>  while ( stringIndex != 15 );
>  v4 = 0;
>  if ( mustBeZero != 1 )
>  {
>    while ( 1 )
>    {
>      ++v4;
>      if ( (unsigned __int8)*(&v9 + v4) - (unsigned __int8)*(&v8 + v4) != *(&v11 + v4) )
>        break;
>      if ( v4 == 14 )
>      {
>        if ( flag[15] )
>        {
>          v6 = v10;
>          for ( i = v9; i != 204; i ^= v6-- )
>            ;
>          return 0;
>        }
>        if ( sub_8048519(0) )
>          return 0;
>        return (unsigned __int8)sub_8048519(*flag) != 0;
>      }
>    }
>  }
>  return 0;
>}
>```

So I figured I'd first try to find an all lowercase flag, so that I dont have to deal with the first two if-statements. And altough the function at sub_8048519 looks very complicated, looking at the input and output of this function for lowercase letters reveals that it is just rot13.

So lets look at the main check, it is this line:

>```c
> if ( (unsigned __int8)*(&v9 + v4) - (unsigned __int8)*(&v8 + v4) != *(&v11 + v4) )
>```

Looking at this in gdb we see that it takes the _i+1_ th character of our input and substracts the _i_ th character, this must then be equal to these values:

>```bash
>0x804888d:	cmp    edx,DWORD PTR [ebp+eax*4-0x4c]
>Breakpoint 3, 0x0804888d in ?? ()
>gdb-peda$ x/15x $ebp+$eax*4-0x4c
>0xffffd000:	0xffffffff	0x00000011	0xfffffff5	0x00000003
>0xffffd010:	0xfffffff8	0x00000005	0x0000000e	0xfffffffd
>0xffffd020:	0x00000001	0x00000006	0xfffffff5	0x00000006
>0xffffd030:	0xfffffff8	0xfffffff6	0x00000000
>```

For which i wrote the following python script to build the flag in reverse:

>```python
>#!/usr/bin/python
>import string
>
>
>def addLetter(solution, number):
>    lastletter = solution[-1:]
>    answer = chr(ord(lastletter) - number)
>    return answer
>
>answers = [-1,  17, -11, 3, -8, 5, 14, -3, 1, 6, -11, 6, -8, -10][::-1]
>
>for letter in string.lowercase:
>    finalsolution = letter
>    for number in answers:
>        finalsolution += addLetter(finalsolution, number)
>    if (finalsolution.isalpha()):
>        print "Got something...: " + finalsolution
>        print "Got it!: " + finalsolution[::-1].encode('rot13')
>```

Which when run gave me: 

>```bash
>$ ./solve.py 
>Got something...: bltnysrugbjgrab
>Got it!: onetwotheflagyo
>```

The flag is: flag{onetwotheflagyo}

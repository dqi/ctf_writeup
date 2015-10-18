## Hackover CTF: i-like-to-move-it

----------
## Challenge details
| Contest        | Challenge     | Category  | Points |
|:---------------|:--------------|:----------|-------:|
| Hackover CTF | i-like-to-move-it  | Reversing | 350  |


*Description*

>I like to move it, move it
>I like to move it, move it
>I like to move it, move it
>You like to move it

----------
## Write-up

It's a mov-uscated binary:

Pintool go!

>```python
>#!/usr/bin/python
>
>import string
>from subprocess import Popen, PIPE, STDOUT
>
>
>pinpath = './pin'
>countpath = './source/tools/ManualExamples/obj-ia32/inscount0.so'
>apppath = './move_it'
>
>key = ''
>
>while True:
>    maximum = 0,0
>    for i in string.letters + string.digits + " _-!+":
>		inputtry = key + i
>		cmd = [pinpath, '-injection', 'child', '-t', countpath , '--' , apppath ]
>		p = Popen(cmd, stdout=PIPE, stdin=PIPE, stderr=STDOUT)
>		stdout = p.communicate(inputtry+'\n' ) 
>		with open('inscount.out') as f:
>			f.seek(6)
>			nb_instructions = int(f.read())
>			f.close()
>		if nb_instructions > maximum[0]:
>			maximum = nb_instructions, i
>   key += maximum[1]
>   print key
>```

Running: 

>```
>~/pin$ ./pin.py 
>t
>tH
>tH1
>tH1s
>tH1sd
>....
>```

After a bit of fidgeting I found that the program expects a "_" to delimit words, but it does not increase the count. Therefor pintool won't find these characters. Add them manually after each word end to continue until:

>```
>$ ./pin.py 
>tH1s_I5_FuN
>```

Feeding the program this string changes the output of the program:

>```
>~/pin$ ./move_it 
>tH1s_I5_FuN
>Never Gonna Give You Up
>```

After some franatic keyboard mashing:

>```
>~/pin$ ./move_it a
>tH1s_I5_FuN
>hackover15{I_L1k3_t0_m0V3_1t_M0v3_1T_Y0u_L1k3_t0_m0v3_1t}
>```

The flag is:

>```
>hackover15{I_L1k3_t0_m0V3_1t_M0v3_1T_Y0u_L1k3_t0_m0v3_1t}
>```

## VolgaCTF 2017 Quals

----------
## Challenge details
| Contest        | Challenge     | Category  | Points |
|:---------------|:--------------|:----------|-------:|
| VolgaCTF Quals | Casino | crypto | 250 |


*Description*
>```
> Take your chances in our the most honest VolgaCTF Quals Grand Casino!
>```

----------
## Write-up

For this challenge we get the python file which is running remotely. Analyzing
this file one can see that it generates a random polynomial in GF(2^N) with N in
[24, 64], and a random non-zero state. It then uses these as the parameters for
a LFSR.

This LFSR is then used to generate 6 bits of random output at a time. This
output is reduced modulo 42. The challenge is then to guess this value. To beat
the challenge we need to guess enough to gain 101 points.

### The idea

To recover the polynomial we want to use the Berlekamp–Massey (I edited
[this](https://grocid.net/2013/12/09/berlekamp-massey-algorithm-for-binary-fields-in-python/)
one by grocid a bit) algorithm, but for this we need degree*2 bits of state.
Fortunately for us the algorithm *almost* directly outputs its state. The only
'protection' is the reduction modulo 42.

### Solution

We have 21 guesses to start with, so we use 20 of these to gain 120 bytes of
state. This amount of bits should be enough for most sessions with the server
since the degree will often be smaller than 61.

Everytime the server responds that the correct guess  was smaller than 22 it is
possible that there was a modular reduction. So we have to account for both
possibilities. We can do this by copying the result so far and appending the
two different options to one of copies. At the end we have a list of lists in
which one of the lists is the actual state used by the remote sever.

Now we can just iterate over the possible degrees N and try Berlekamp-Massey on
each of the possible states we found. If Berlekamp-Massey returns a polynomial
of degree N there is a chance that we found the original state and the original
polynomial. To check this we can just initialize the state like the server does
and see if the output of the LFSR with this state and polynomial  matches the
first 20 outputs that we found earlier. If so we generate the 101 next states
and send them to the server for the flag.

Fun sidenote: I got the flag at N=30 with 5min left in the CTF, pretty lucky to get
a low-ish N.

### Code

```python
#!/usr/bin/env python
# -*- coding: utf-8 -*-

from pwn import *
import itertools as it
import bm  #  grocid's implementation of Berlekamp-Massey


# Copied from remote server
class Generator:
    def __init__(self, p, init_state=1):
        m = len(p) - 1
        self.rshift = m - 1
        self.state = init_state & (2 ** m - 1)
        self.polynomial = int(''.join(map(str, p[1:])), 2)

    def next_bit(self):
        n = self.state & 1
        v = bin(self.state & self.polynomial).count('1') & 1
        self.state = (self.state >> 1) | (v << self.rshift)
        return n

    def next_number(self, bc):
        num = 0
        for i in range(bc):
            num |= self.next_bit() << (bc - 1 - i)
        return num


host = 'casino.quals.2017.volgactf.ru'
# socat TCP4-listen:8788,reuseaddr,fork EXEC:./casino_server.py
host = 'localhost'
port = 8788

s = remote(host, port)
if host != 'localhost':
    l = s.recvline()
    chal = l.split('==')[2].strip().strip("'")
    log.info('Got challenge: ' + chal)
    for comb in it.product(string.ascii_letters, repeat=5):
        x = chal + ''.join(comb)
        h = int(hashlib.sha1(x).hexdigest(), 16)
        if (h & 0x3ffffff) == 0x3ffffff:
            log.info('SHA1(%s) == %s' % (x, hashlib.sha1(x).hexdigest()))
            s.sendline(x)
            break

log.info('starting..')
stream = [[]]
for i in range(20):
    s.recvuntil('Guess a number in range [0, 42):')
    s.sendline('23')
    s.recvline()
    l = s.recvline()
    if 'Wrong' in l:
        truenr = int(l.split()[4][:-1])
        # log.info('nr: %d' % truenr)
        if truenr > 21:
            for i in stream:
                i.append(truenr)
        else:
            tmpstream = []
            for i in stream:
                tmpstream.append(i + [truenr])
                tmpstream.append(i + [truenr + 42])
            stream = tmpstream
    elif 'Congratulations!' in l:
        truenr = 23
        # log.success('nr: %d' % truenr)
        for i in stream:
            i.append(truenr)
    else:
        log.error('Did not get number')

bsl = []
for i in stream:
    bitstream = ''.join([b[2:].zfill(6) for b in map(bin, i)])
    bsl.append((bitstream, i))

for N in range(24, 65):
    log.info('Trying N=%d' % N)

    polystate = []
    for i, n in bsl:
        try:
            p = bm.bm(i, 64)
        except IndexError:
            continue
        while p[-1] == 0:
            p.pop()
	# Possible solution found?
        if len(p) == N + 1:
            polystate.append((p, i, n))

    if len(polystate) > 0:
        for poly, state, ints in polystate:
            # print 'actual values:\n', ints
            state = int(''.join(map(str, state[:N][::-1])), 2)
            generator = Generator(poly, state)

            ans = []
            for i in range(20):
                ans.append(generator.next_number(6))
            if ans[:20] == ints[:20]:
                log.success('got it!')
                for i in range(101):
                    try:
                        print s.recvuntil('Guess a number in range [0, 42):')
                        guess = str(generator.next_number(6) % 42)
                        print 'guess %s' % guess
                        s.sendline(guess)
                    except:
                        print s.recvall(timeout=5)
                exit()
            else:
                log.failure('wrong poly')
```


The flag is.

```
VolgaCTF{G@mbling_is_fun_but_rarely_a_pr0f1t}
```

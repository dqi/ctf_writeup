#!/usr/bin/env python
# -*- coding: utf-8 -*-

from pwn import *
import itertools as it
import bm


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
for N in range(24, 65):
    log.info('Trying N=%d' % N)
    for i in stream:
        bitstream = ''.join([b[2:].zfill(6) for b in map(bin, i)])
        bsl.append((bitstream, i))

    polystate = []
    for i, n in bsl:
        try:
            p = bm.bm(i, 64)
        except IndexError:
            continue
        while p[-1] == 0:
            p.pop()
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

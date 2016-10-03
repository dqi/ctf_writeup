#!/usr/bin/env python
# -*- coding: utf-8 -*-

from pwn import *
import libnum
import gmpy2
import hashlib
import sympy as sp

host = '130.211.200.153'
port = 25519
order = 'Give me the flag. This is an order!'
orderpad = 'Give me the flag. This is an order!    '

s = remote(host, port)

L = 0
R = 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff

# For initially getting q
# for _ in range(256):
#     if L > R:
#         print 'uhh'
#         exit(-1)
#     m = (L + R) / 2
#     msg = '%064x' % m
#     msg += order
#     s.sendline(msg)
#     r = s.recvline()
#     if ':' in r:
#         # lower
#         L = m + 1
#     else:
#         R = m + 1

q = 0x247ce416cf31bae96a1c548ef57b012a645b8bff68d3979e26aa54fc49a2c297
log.info('q: ' + hex(q))

# lets get a,b now...

ans = []
points = []
for i in [3, 6]:
    msg = '%064x' % i
    msg += order
    s.sendline(msg)
    root = int(s.recvline().strip().split(',')[1][1:-1], 16)
    points.append((i, root))
    orig = pow(root, 2, q)
    orig = orig - pow(i, 3, q)
    ans.append(orig)  # s * a + b

a, b = sp.symbols('a b')
sol = sp.solve([ans[0] - (3 * a + b), ans[1] - (6 * a + b)], a, b)

a = int(gmpy2.divm(-1264784453881987711378734714637094073662569449865694247234410111979889287160, 3, q))
b = int(sol[b] % q)

log.info('a: ' + hex(a))
log.info('b: ' + hex(b))
curve = libnum.ecc.Curve(a, b, q)

# now we just need to get a point S st eS[0] = h
h = int(hashlib.sha256(orderpad).hexdigest(), 16)
H = curve.check_x(h)[0]
# print H

n = 65537
l = 16503925798136106726026894143294039201930439456987742756395524593191976084900
k = gmpy2.invert(n, l)
Q = curve.power(H, k)

msg = '%064x' % Q[0]
msg += orderpad
s.sendline(msg)
print s.recvline()

#!/usr/bin/env python
# -*- coding: utf-8 -*-

from crypto_backdoor import mul, add, encrypt, Sn, encrypted_message, p, g, A, B
from libnum import solve_crt
from math import sqrt, ceil


# Quick and dirty implementation:
def babygiant(P, Q, prime):
    m = int(ceil(sqrt(prime)))
    # We need -mP, this is given by (prime-2)*m*P since the order of P is
    # 'prime'
    mP = mul((prime-2)*m, P, prime)
    # Baby-steps
    Pc = [mul(i, P, prime) for i in range(m)]
    # Giant-steps
    for j in range(m):
        jmP = mul(j, mP, prime)
        R = add(Q, jmP, prime)
        if R in Pc:
            i = Pc.index(R)
            ans = (i + j*m) % prime
            return ans

# p's factorisation:
primes = [901236131, 911236121, 921236161, 931235651, 941236273, 951236179, 961236149]

# Reduce the points
Apoints = []
Bpoints = []
glist = []
for pi in primes:
    Apoints += [(A[0] % pi, A[1] % pi)]
    Bpoints += [(B[0] % pi, B[1] % pi)]
    glist += [(g[0] % pi, g[1] % pi)]

# Sanity check the orders
for i in range(len(glist)):
    assert mul(primes[i], glist[i], primes[i]) == glist[i]
    assert mul(primes[i], Apoints[i], primes[i]) == Apoints[i]
    assert mul(primes[i], Bpoints[i], primes[i]) == Bpoints[i]

# reconstruct secretAlice
print "recovering Alices secret:"
aliceSecrets = []
for i in range(len(glist)):
        aliceSecrets.append(babygiant(glist[i], Apoints[i], primes[i]))
# aliceSecrets = [418335728, 97096718, 147499822, 749957078, 445387078, 468722272, 793852246]
print aliceSecrets

# reconstruct secretBob
print "recovering Bobs secret:"
bobSecrets = []
for i in range(len(glist)):
        bobSecrets.append(babygiant(glist[i], Bpoints[i], primes[i]))
# bobSecrets = [71971632, 111512372, 24598024, 73353382, 217014904, 927343918, 934896152]
print bobSecrets

# Calculate the shared secrets for the primes:j
mul_points = []
for i in range(len(glist)):
        mul_points += [mul(aliceSecrets[i] * bobSecrets[i], glist[i], primes[i])]
# Recover a*b*G using CRT
x = solve_crt([x[0] for x in mul_points], primes)
y = solve_crt([y[1] for y in mul_points], primes)

masterSecret = x * y
print "Found masterSecret: %d" % masterSecret

decrypted_message = Sn(encrypt(encrypted_message, masterSecret), 31)
print decrypted_message

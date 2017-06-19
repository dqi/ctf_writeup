## Google CTF 2017

----------
## Challenge details
| Contest        | Challenge     | Category  | Points |
|:---------------|:--------------|:----------|-------:|
| Google CTF 2017 | Crypto Backdoor | crypto | 139 |


*Description*
```
This public-key cryptosystem has a flaw. Can you exploit it?
```

----------
## Write-up

For this challenge we get a python file which appears to define some sort of
elliptic curve cryptosystem. This scheme is used by Alice and Bob to establish a
shared secret, which is then used to encrypt the flag.

The provided parameters are:

1. Modulus p
2. The generator point g
3. Alice's public key A
4. Bob's public key B

Which are:

```
p = 606341371901192354470259703076328716992246317693812238045286463
g = (160057538006753370699321703048317480466874572114764155861735009, 255466303302648575056527135374882065819706963269525464635673824)
A = (460868776123995205521652669050817772789692922946697572502806062, 263320455545743566732526866838203345604600592515673506653173727)
B = (270400597838364567126384881699673470955074338456296574231734133, 526337866156590745463188427547342121612334530789375115287956485)
```

## Failed attempt

I notice pretty fast that this p is not a prime, which seems to suggest the
solution to this challenge will involve taking discrete logarithms modulo the
factors of p.

My first attempt involved trying to reconstruct the elliptic curve used, since
a curve is defined as `y^2 = x^3 + ax + b` we should be able to recover the
curve uniquely from the three given points. But no such `a, b` exist which
satisfy the equations.

This fact with the strange addition laws of points:
```
x3 = ((x1*x2 - x1*y2 - x2*y1 + 2*y1*y2)*modinv(x1 + x2 - y1 - y2 - 1, p)) % p
y3 = ((y1*y2)*modinv(x1 + x2 - y1 - y2 - 1, p)) % p
```
(Some sort of masking scheme?), makes this approach seem unlikely to succeed.

## Try two:

Note: p = reduce([p0, p1, p2, p3, p4, p5, p6])

Reducing the (x, y) coordinates modulo the factors of p, I noticed that these
reduced points all have order `pi`, and as such we can use the Baby-steps giant
steps algorithm to take the discrete logs in sqrt(pi) steps. Since all the pi
are small this is fast enough.

After we do this for `A` and `B` we will get the secrets of Alice and Bob modulo
the `pi's`. We can then multiply the combined secrets with the reduced generator
point. From this we get seven points (x, y).  Now we need only combine the x and
y coordinates with CRT to recover the shared secret. Decrypting the flag is then
just an easy XOR away.

## Code

The following code solves the challenge:

```python
#!/usr/bin/env python
# -*- coding: utf-8 -*-

from crypto_backdoor import mul, add, encrypt, Sn, encrypted_message, p, g, A, B
from libnum import solve_crt
from math import sqrt, ceil


# Quick and dirty implementation:
def babygiant(P, Q, prime):
    m = int(ceil(sqrt(prime)))
    # We need -mP, this is given by (prime-2)*m*P since the order of P is 'prime'
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

# Calculate a*b* reduced(g)
mul_points = []
for i in range(len(glist)):
        mul_points += [mul(aliceSecrets[i] * bobSecrets[i], glist[i], primes[i])]
# Recover a*b*g using CRT
x = solve_crt([x[0] for x in mul_points], primes)
y = solve_crt([y[1] for y in mul_points], primes)

masterSecret = x * y
print "Found masterSecret: %d" % masterSecret

decrypted_message = Sn(encrypt(encrypted_message, masterSecret), 31)
print decrypted_message
```

## Flag

The flag is:

```
CTF{Anyone-can-make-bad-crypto}
```

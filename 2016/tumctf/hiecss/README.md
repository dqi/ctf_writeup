## TUMCTF: hiecss

----------
## Challenge details
| Contest        | Challenge     | Category  | Points |
|:---------------|:--------------|:----------|-------:|
| TUM CTF | hiecss | crypto | 150 + $ALGORITHM  |


*Description*
>```
>Our intern insisted on designing an elliptic-curve signature scheme. Needless to say, it went… quite wrong.
>
>He is now back at brewing coffee all day long.
>```

----------
## Write-up

For this challenge we get the following python code:

>```python
>#!/usr/bin/env python3
>import gmpy2
>from Crypto.Hash import SHA256
>
>e = 65537
>order = 'Give me the flag. This is an order!'
>
>def sqrt(n, p):
>    if p % 4 != 3: raise NotImplementedError()
>    return pow(n, (p + 1) // 4, p) if pow(n, (p - 1) // 2, p) == 1 else None
>
># just elliptic-curve addition, nothing to see here
>def add(q, a, b, P, Q):
>    if () in (P, Q):
>        return (P, Q)[P == ()]
>    (Px, Py), (Qx, Qy) = P, Q
>    try:
>        if P != Q: lam = (Qy - Py) * gmpy2.invert(Qx - Px, q) % q
>        else: lam = (3 * Px ** 2 + a) * gmpy2.invert(2 * Py, q) % q
>    except ZeroDivisionError:
>        return ()
>    Rx = (lam ** 2 - Px - Qx) % q
>    Ry = (lam * Px - lam * Rx - Py) % q
>    return int(Rx), int(Ry)
>
># just elliptic-curve scalar multiplication, nothing to see here
>def mul(q, a, b, n, P):
>    R = ()
>    while n:
>        if n & 1: R = add(q, a, b, R, P)
>        P, n = add(q, a, b, P, P), n // 2
>    return R
>
>def decode(bs):
>    if len(bs) < 0x40:
>        return None
>    s, m = int(bs[:0x40], 16), bs[0x40:]
>    if s >= q:
>        print('\x1b[31mbad signature\x1b[0m')
>        return None
>    S = s, sqrt(pow(s, 3, q) + a * s + b, q)
>    if S[1] is None:
>        print('\x1b[31mbad signature:\x1b[0m {:#x}'.format(S[0]))
>        return None
>    h = int(SHA256.new(m.encode()).hexdigest(), 16)
>    if mul(q, a, b, e, S)[0] == h:
>        return m
>    else:
>        print('\x1b[31mbad signature:\x1b[0m ({:#x}, {:#x})'.format(*S))
>
>if __name__ == '__main__':
>
>    q, a, b = map(int, open('curve.txt').read().strip().split())
>
>    for _ in range(1337):
>        m = decode(input())
>        if m is not None and m.strip() == order:
>            print(open('flag.txt').read().strip())
>            break
>```

### The idea

The first thing the script does is:

>```python
>q, a, b = map(int, open('curve.txt').read().strip().split())
>```

Which means the parameters for this curve are unknown to us, hinting that the
security of this scheme might be based on the secrecy of the curve, which is
obviously a Very Bad Idea.

The following line confirms as much:

>```python
>    h = int(SHA256.new(m.encode()).hexdigest(), 16)
>    if mul(q, a, b, e, S)[0] == h:
>```

This is the actual signature verification and we know *e* and *h*. We need to
find a point S on the curve (h, y) such that eS = (h, y). But if we know the
order of the curve this is trivial because the multiplicative inverse is given
b:

> ```
> k = gmpy2.invert(n, l)
> ```

Where *l* is the order of the curve and n the element to invert (here 65537).


### Retrieving q

In the decode function we have the following lines:

>```python
>    s, m = int(bs[:0x40], 16), bs[0x40:]
>    if s >= q:
>        print('\x1b[31mbad signature\x1b[0m')
>        return None
>```

Since we control *s*, and this error is distinguisable from the other errors, we
can use it to search for *q* with a binary search.

>```python
>  for _ in range(256):
>      if L > R:
>          print 'uhh'
>          exit(-1)
>      m = (L + R) / 2
>      msg = '%064x' % m
>      msg += order
>      s.sendline(msg)
>      r = s.recvline()
>      if ':' in r:
>          # lower
>          L = m + 1
>      else:
>          R = m + 1
>```

Which gives us *q*:

>```
> q = 0x247ce416cf31bae96a1c548ef57b012a645b8bff68d3979e26aa54fc49a2c297
>```

### Retrieving a and b

Now for a given s, the script constructs a point S on the curve, since it
returns us this point when the signature is wrong we can use this information to
make two equations with the two unknows *a* and *b*. This equation is solvable
and gives us *a* and *b*.

>```python
> ans = []
> points = []
> for i in [3, 6]:
>     msg = '%064x' % i
>     msg += order
>     s.sendline(msg)
>     # We get the root of i back from the server
>     root = int(s.recvline().strip().split(',')[1][1:-1], 16)
>     points.append((i, root))
>     # square to get the root out
>     orig = pow(root, 2, q)
>     # remove to power to get an equation in a and b
>     orig = orig - pow(i, 3, q)
>     # got an equation in a and b
>     ans.append(orig)  # s * a + b
>
>  a, b = sp.symbols('a b')
>  sol = sp.solve([ans[0] - (3 * a + b), ans[1] - (6 * a + b)], a, b)
>```

This gives us:

> ```
> sol[a] = -1264784453881987711378734714637094073662569449865694247234410111979889287160/3
> sol[b] = 8575167449093451733644615491327478728087226005203626331099704278682109092640
> ```

Or in hex, reduced modulo q:

> ```
> a = 0xb3b04200486514cb8fdcf3037397558a8717c85acf19bac71ce72698a23f635
> b = 0x12f55f6e7419e26d728c429a2b206a2645a7a56a31dbd5bfb66864425c8a2320
> ```

### Retrieving a flag

To get the order of the curve I used sage:

> ```
> sage: a = 0xb3b04200486514cb8fdcf3037397558a8717c85acf19bac71ce72698a23f635
> sage: b = 0x12f55f6e7419e26d728c429a2b206a2645a7a56a31dbd5bfb66864425c8a2320
> sage: q = 0x247ce416cf31bae96a1c548ef57b012a645b8bff68d3979e26aa54fc49a2c297
> sage: E = EllipticCurve(GF(q), [a,b])
> sage: E.order()
> 16503925798136106726026894143294039201930439456987742756395524593191976084900
> ```

Therefor for any messagehash smaller than *q* we can now calculate a point S
such that eS = H. The hash of the given order is greater than *q* but because the
whitespace stripping we can just append whitespace until we get a hash smaller
than *q*.

The final part is:

>```
> curve = libnum.ecc.Curve(a, b, q)
> orderpad = 'Give me the flag. This is an order!    '
> h = int(hashlib.sha256(orderpad).hexdigest(), 16)
> H = curve.check_x(h)[0]
> n = 65537
> l = 16503925798136106726026894143294039201930439456987742756395524593191976084900
> # Multiplicative inverse
> k = gmpy2.invert(n, l)
> Q = curve.power(H, k)
> msg = '%064x' % Q[0]
> msg += orderpad
> s.sendline(msg)
> print s.recvline()
>```


The flag is:

> ```
> hxp{H1dd3n_Gr0uP_0rD3rz_4r3_5uPP0s3D_t0_B3_k3p7_h1DD3n!}
> ```

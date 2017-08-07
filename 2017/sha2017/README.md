## SHA2017 CTF

----------
## Challenge details
| Contest        | Challenge     | Category  | Points |
|:---------------|:--------------|:----------|-------:|
| SHA2017 CTF | Secure Login | crypto | 200 |


*Description*
```
This server uses signed tickets to allow users to login, can you find the flag?
```

----------
## Write-up

For this challenge we get a python file, which describes a signature-based
login system. In order to log in as admin we need to obtain a signature on a
string starting with 'ticket:admin|root|'.

The system allows us to sign any message, but it will prepend '\xff' in front of
it, so we cannot directly get a signature on the target string.

To bypass this protection we do the following:

- Create a random pair of (m1, s1), where s1 is a signature on m1.
- Set m = 'ticket:admin|root|whatever'
- Compute `m2 = m * (1/m1)`
- If m2 does not start with '\xff' then start over with a new random pair.
- Else get a signature s2 on m2, we can do this by leaving out the leading '\xff'.
- Now compute `sig = s2 * s1 = m1^d * (m^d * m1^(-d)) == m^d`
- Send sig to server and obtain flag!

The following code does exactly that:

```python
#!/usr/bin/env python
# -*- coding: utf-8 -*-

from pwn import *
from gmpy2 import divm

n = 25504352309535290475248970674346405639150033303276037621954645287836414954584485104061261800020387562499019659311665606506084209652278825297538342995446093360707480284955051977871508969158833725741319229528482243960926606982225623875037437446029764584076579733157399563314682454896733000474399703682370015847387660034753890964070709371374885394037462378877025773834640334396506494513394772275132449199231593014288079343099475952658539203870198753180108893634430428519877349292223234156296946657199158953622932685066947832834071847602426570899103186305452954512045960946081356967938725965154991111592790767330692701669
e = 65537


# Translate byte array back to number \x16\x2e = 0x162e = 5678
def str2num(s):
    return int(s.encode('hex'),16)


# Translate a number to a string (byte array), for example 5678 = 0x162e = \x16\x2e
def num2str(n):
    d = ('%x' % n)
    if len(d) % 2 == 1:
        d = '0' + d
    return d.decode('hex')


host = 'secure-login.stillhackinganyway.nl'
port = 12345

m = str2num('ticket:admin|root|<this space is available>')

while 1:
    # Create a valid signature - message pair
    s1 = str2num(os.urandom(40))
    m1 = pow(s1, e, n)

    # Create m2 = m*inv(m1) a sign on this is (m^d*m1^(-d))
    m2 = (m * divm(1, m1, n)) % n
    if num2str(m2)[0] == '\xff':
        s = remote(host, port)
        s.recvuntil('Choice: ')
        s.sendline('3')
        s.recvuntil(': ')
        msg = num2str(m2)[1:]
        # Find errors
        assert str2num('\xff' + msg) < n
        assert len('\xff' + msg) < 1025
        s.sendline(msg.encode('hex'))
        data = s.recvuntil('signature:\n').strip()
        s2 = s.recvline().strip().decode('hex')
        s.close()
        s2 = str2num(s2)
        # now s1 * s2 = m1^d * (m^d * m1^(-d)) == m^d
        sig = (s1 * s2) % n
        break

s = remote(host, port)
s.recvuntil('Choice: ')
s.sendline('2')
print s.recvuntil(': ')
s.sendline(num2str(sig).encode('hex'))
print s.recvall(timeout=2)
```

## TMCTF: crypto200

----------
## Challenge details
| Contest        | Challenge     | Category  | Points |
|:---------------|:--------------|:----------|-------:|
| tmctf | Q | Crypto | 200  |


----------
## Write-up

![alt Q](Q.png)

For this challenge we are given a single image, which reveals:

* AES-encryption
* The first 14 characters of the 16 character key
* The plaintext
* Part of the ciphertext

Our objective is to recover the IV.

Since this is standard AES, we know the blocksize is 16. We also see the plaintext: "The message is protected by AES!". Is 32 characters, so this means there are only 2 blocks for the CBC mode.

The ciphertext we have is: 

>```
>fe <missing> 9ec3 - 307df037c689300bbf2812ff89bc0b49
>```

In CBC mode decryption we first decrypt a block with the key and then XOR it against the previous block. We also know the full plaintext, therefor we can bruteforce the last two characters of the key by just decrypting with different keys until we get the right plaintext in block 2 position 1, 15 and 16. (for which we have the ciphertext of the previous block)

This gives the key:

>```
>5d6I9pfR7C1JQt7$
>```

Now i fill the ciphertext with nullbytes: fe000000000000000000000000009ec3-307df037c689300bbf2812ff89bc0b49.

When we decrypt with this ciphertext the bytes we need are XOR'd against zero values, which does not change them. Since we also have the plaintext we know what they should be. This means we can recover the ciphertext by xor'ing the bytes of this decrypted text against the known plaintext.

The last step is to decrypt the recovered ciphertext, it's really the same process: We decrypt with IV = "\x00"*16, get some decryption text, XOR it against the known plaintext and recover the IV.

The python code:

>```python
>#!/usr/bin/python
>
>from Crypto.Cipher import AES
>import binascii
>import string
>import itertools
>
># given
>bKEY = "5d6I9pfR7C1JQt"
>
># use null bytes to minimize effect on output
>IV = "\x00"*16
>
>
>def encrypt(message, passphrase):
>    aes = AES.new(passphrase, AES.MODE_CBC, IV)
>    return aes.encrypt(message)
>
>
>def decrypt(cipher, passphrase):
>    aes = AES.new(passphrase, AES.MODE_CBC, IV)
>    return aes.decrypt(cipher)
>
>
>pt = "The message is protected by AES!"
>ct = "fe000000000000000000000000009ec3307df037c689300bbf2812ff89bc0b49"
>
># find the key using the plaintext and ciphertext we know, since the IV has no effect on the decryption of the second block
>for i in itertools.product(string.printable, repeat=2):
>    eKEY = ''.join(i)
>    KEY = bKEY + eKEY
>    ptc = decrypt(binascii.unhexlify(ct), KEY)
>    if ptc[16] == pt[16] and ptc[30] == pt[30] and ptc[31] == pt[31]:
>        print "Got KEY: " + str(KEY)
>        fKEY = KEY
>        pt2 = binascii.hexlify(decrypt(binascii.unhexlify(ct), fKEY))[32:]
>        print "Decrypting with CT mostly zeroes gives: " + pt2
>        print "Should be: " + binascii.hexlify(pt[16:])
># we can now recover the rest of the ciphertext ct by XOR(pt[i], decrypted[i], since we chose ct 00 in all the positions we are going to recover
>        answer = ""
>        for i in range(13):
>            pi = pt[17+i]  # letters from the plaintext
>            pti = pt2[2*i+2:2*i+4]  # 2 hex letters from decryption of second block
>            answer += "%02X" % (ord(pi) ^ int(pti, 16))
>        rct = ct[0:2] + answer.lower() + ct[28:]
>        print "Which means CT was: " + rct
>
># now we can decrypt the recovered ct and xor against the pt to recover the IV
>wpt = decrypt(binascii.unhexlify(rct), fKEY)
>IV = ""
>for i in range(16):
>    p = ord(pt[i]) ^ ord(wpt[i])
>    IV += "%02X" % p
>IV = binascii.unhexlify(IV)
>
># sanity check:
>aes = AES.new(fKEY, AES.MODE_CBC, IV)
>print "Sanity check: " + aes.decrypt(binascii.unhexlify(rct))
>
># We won!
>print "The IV is: " + IV
>```

Which gives:

>```
>$ ./decrypt.py 
>Got KEY: 5d6I9pfR7C1JQt7$
>Decrypting with CT mostly zeroes gives: 727eed647e31ad19308b916280d15321
>Should be: 726f7465637465642062792041455321
>Which means CT was: fe1199011d45c87d10e9e842c1949ec3307df037c689300bbf2812ff89bc0b49
>Sanity check: The message is protected by AES!
>The IV is: Key:rVFvN9KLeYr6
>```

The flag is:

>```
>TMCFT{rVFvN9KLeYr6}
>```

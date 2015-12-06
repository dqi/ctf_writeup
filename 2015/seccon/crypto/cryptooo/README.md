## SECCON: Decrypt it

----------
## Challenge details
| Contest        | Challenge     | Category  | Points |
|:---------------|:--------------|:----------|-------:|
| SECCON | Decrypt it | Crypto | 300  |

*Description*
>$ ./cryptooo SECCON{*************************}

>Encrypted(44): waUqjjDGnYxVyvUOLN8HquEO0J5Dqkh/zr/3KXJCEnw=

>what's the key?


----------
## Write-up

If we do something like:

>```
>./cryptooo SECCON\{
>Encrypted(12): waUqjjDGnQ==
>```

We can see that we already have the "waUqjjDGn" part right, this means we should be able to slowly extend the flag until we reach the encrypted flag.

I used bash commands like

>```
>reset; for i in SECCON\{{{A..z},{0..9}}; do echo $i; ./cryptooo $i; done
>```

in the beginning to slowly increase the message, however a pattern becomes appearant pretty fast and you can just check if the expected letters fit in, there is just one stray 1 in there.

After a while the flag is found:

>```
>$ for i in SECCON\{Cry_Pto_Oo_Oo1Oo_oo_Oo_{O,o,0}\}; do echo $i; ./cryptooo $i; done
>SECCON{Cry_Pto_Oo_Oo1Oo_oo_Oo_O}
>Encrypted(44): waUqjjDGnYxVyvUOLN8HquEO0J5Dqkh/zr/3KXJCEnw=
>SECCON{Cry_Pto_Oo_Oo1Oo_oo_Oo_o}
>Encrypted(44): waUqjjDGnYxVyvUOLN8HquEO0J5Dqkh/zr/3KXJCMj8=
>SECCON{Cry_Pto_Oo_Oo1Oo_oo_Oo_0}
>Encrypted(44): waUqjjDGnYxVyvUOLN8HquEO0J5Dqkh/zr/3KXJCbUM=
>```

Making the flag:

>```
>SECCON{Cry_Pto_Oo_Oo1Oo_oo_Oo_O}
>```

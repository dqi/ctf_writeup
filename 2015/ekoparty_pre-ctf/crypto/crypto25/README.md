## ekoparty_pre-ctf: crypto25

----------
## Challenge details
| Contest        | Challenge     | Category  | Points |
|:---------------|:--------------|:----------|-------:|
| ekoparty_pre-ctf | BASE unknown | Crypto |    25 |


>*Description*
> IVFU662CIFJUKXZTGJPWG2DBNRWH2=== 

----------
## Write-up

The challenge title gives a pretty big hint that this is some basexx encoded string, trying at my (new) favourite website http://tomeko.net/online_tools/ we find that base32->hex->plaintext gets us the flag:

Flag:

>```
>EKO{BASE_32_chall}
>```

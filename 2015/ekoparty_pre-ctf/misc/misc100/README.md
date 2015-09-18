## ekoparty_pre-ctf: misc100

----------
## Challenge details
| Contest        | Challenge     | Category  | Points |
|:---------------|:--------------|:----------|-------:|
| ekoparty_pre-ctf | Password manager | Misc | 100  |



>*Description*
> It looks like someone has been using a really bad key!
> Hints: [a-zA-Z0-9]{0,4}
>Attachment: misc100.zip 

----------
## Write-up

We have a mypasswords file in the .zip

Lets see what we are dealing with:

>```
>$ file mypasswords 
>mypasswords: Password Safe V3 database
>```

For this format john can extract the hash:

>```
>$ ./pwsafe2john ~/ctf/eko/misc100/mypasswords > tocrack
>```

We are given a regexp for the password format, lets bruteforce Alphanumeric between 1 and 4 characters:

>```
>./john --incremental=Alnum tocrack
>```

Where john.conf defines Alnum as:

>```
>[Incremental:Alnum]
>File = $JOHN/alnum.chr
>MinLen = 0
>MaxLen = 4
>CharCount = 62
>```

After about 20 minutes it gives us the password:

>```
>mypasswords:Ek0
>```

Could've guessed that one...

We can use this password to open the mypasswords file and get the password; which is the flag:

>```
>EKO{password_managers_rulez}
>```

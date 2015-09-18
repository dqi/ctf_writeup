## ekoparty_pre-ctf: reversing25

----------
## Challenge details
| Contest        | Challenge     | Category  | Points |
|:---------------|:--------------|:----------|-------:|
| ekoparty_pre-ctf | EKOGIFT | Reversing | 25  |


>*Description*
> The easiest reversing challenge!
> Attachment: reversing25.zip 

----------
## Write-up

Open the binary in IDA, and go to where it prints "Great! your flag is %s\n", to get there it just compares the letters against argv1 one by one:

The flag is:

>```
>EKO{this_is_a_gift}
>```

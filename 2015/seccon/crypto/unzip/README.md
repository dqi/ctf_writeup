## SECCON: unzip

----------
## Challenge details
| Contest        | Challenge     | Category  | Points |
|:---------------|:--------------|:----------|-------:|
| SECCON | unzip | crypto | 100  |

*Description*
> Unzip the file

----------
## Write-up

In the zip file there are three files: 

>```
>backnumber08.txt
>backnumber09.txt
>flag.txt
>```

After some searching we come across the pkcrack utility [here](https://www.unix-ag.uni-kl.de/~conrad/krypto/pkcrack.html). It is able to crack a zipfile if we can abtain a plaintext for one of the files.

Luckily we can find backnumber08.txt and backnumber09.txt online:

- http://2014.seccon.jp/mailmagazine/backnumber09.txt
- http://2014.seccon.jp/mailmagazine/backnumber08.txt

Using these and the pkcrack we can decrypt the files.

For this attack to work the files need to be zipped using the exact same algorithm:

>```
>$ unzip -v unzip
>Archive:  unzip
> Length   Method    Size  Cmpr    Date    Time   CRC-32   Name
>--------  ------  ------- ---- ---------- ----- --------  ----
>   14182  Defl:N     5288  63% 2015-11-30 08:23 30b7a083  backnumber08.txt
>   12064  Defl:N     4839  60% 2015-11-30 08:22 b93d9a46  backnumber09.txt
>   22560  Defl:N    11021  51% 2015-12-01 07:21 fcd63eb6  flag
>--------          -------  ---                            -------
>   48806            21148  57%                            3 files
>```

After some fidgeting:

>```
>$ zip -6 out.zip backnumber09.txt backnumber08.txt ; unzip -v out.zip
>  adding: backnumber09.txt (deflated 60%)
>  adding: backnumber08.txt (deflated 63%)
>Archive:  out.zip
> Length   Method    Size  Cmpr    Date    Time   CRC-32   Name
>--------  ------  ------- ---- ---------- ----- --------  ----
>   12064  Defl:N     4839  60% 2015-12-05 15:56 b93d9a46  backnumber09.txt
>   14182  Defl:N     5288  63% 2015-12-05 15:56 30b7a083  backnumber08.txt
>--------          -------  ---                            -------
>   26246            10127  61%                            2 files
>```

Now that we have the same files zipped but in plaintext pkcrack can preform a known plaintext attack:

>```
>$ pkcrack-1.2.2/src/pkcrack -C unzip -c backnumber08.txt -P out.zip -p backnumber08.txt -d plain -a
>Files read. Starting stage 1 on Sun Dec  6 15:09:15 2015
>Generating 1st generation of possible key2_5299 values...done.
>Found 4194304 possible key2-values.
>Now we're trying to reduce these...
>Lowest number: 984 values at offset 970
>Lowest number: 932 values at offset 969
>Lowest number: 931 values at offset 967
>Lowest number: 911 values at offset 966
>Lowest number: 906 values at offset 965
>Lowest number: 904 values at offset 959
>Lowest number: 896 values at offset 955
>Lowest number: 826 values at offset 954
>Lowest number: 784 values at offset 606
>Lowest number: 753 values at offset 206
>Done. Left with 753 possible Values. bestOffset is 206.
>Stage 1 completed. Starting stage 2 on Sun Dec  6 15:09:26 2015
>Ta-daaaaa! key0=270293cd, key1=b1496a17, key2=8fd0945a
>Probabilistic test succeeded for 5098 bytes.
>Ta-daaaaa! key0=270293cd, key1=b1496a17, key2=8fd0945a
>Probabilistic test succeeded for 5098 bytes.
>Stage 2 completed. Starting zipdecrypt on Sun Dec  6 15:09:49 2015
>Decrypting backnumber08.txt (5315a01322ab296c211eecba)... OK!
>Decrypting backnumber09.txt (83e6640cbec32aeaf10ed1ba)... OK!
>Decrypting flag (34e4d2ab7fe1e2421808bab2)... OK!
>```

Now that we have it unzipped we can just unzip the flag file and open it in libleoffice and change the text color to find the flag:

>```
>SECCON{1s_th1s_passw0rd_weak?}
>```

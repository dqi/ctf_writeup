#!/usr/bin/python

from pwn import *

answer = "iKWoZLVc4LTyGrCRedPhfEnihgyGxWrCGjvi37pnPGh2f1DJKEcQZMDlVvZpEHHzU"

a4 = answer[24:30]
a2 = xor(xor(a4, chr(0x23)*6), answer[6:12])
a1 = xor(answer[0:6], a2)
a3 = xor(answer[12:18], a4)
a5 = xor(xor(xor(answer[18:24], a3), a4), chr(0x23)*6)

with open("keyABCD", "w") as f:
    f.writelines((a1 + "\n", a2 + "\n", a3 + "\n", a4 + "\n", a5))

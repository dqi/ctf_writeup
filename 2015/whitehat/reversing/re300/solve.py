#!/usr/bin/python
import string


def addLetter(solution, number):
    lastletter = solution[-1:]
    answer = chr(number - ord(lastletter))
    return answer

answers1 = [223, 210, 222, 167, 155, 156, 168, 166, 98, 97, 102, 86, 85, 161, 161, 174, 228, 216, 213]

part1 = "w"
for number in answers1:
	part1 += addLetter(part1, number)
# print part1

answers2 = [147, 158, 226, 167, 166, 231, 179, 180, 227, 234, 175, 102, 175, 219, 201, 224, 169, 175,175, 65]

part2 = "c"
for number in answers2:
	part2 += addLetter(part2, number)
# print part1 + part2

answers3 = [219, 146, 167, 164, 147, 151, 164, 228, 233, 231, 165, 167, 220, 155, 153, 226, 219, 147, 155, 66]


part3 = "|"
for number in answers3:
	try:
		part3 += addLetter(part3, number)
	except ValueError:
		continue
print part1 + part2 + part3

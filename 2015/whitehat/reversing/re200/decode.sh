#!/bin/bash
filename="$1"
while read line;do
		echo $line
        base64 -d <<< $line
		echo ""
done < "$filename"

#!/bin/sh
fn="$1"
if [ \! -r "$fn" ]; then
	echo "usage: $0 <filename>" >&2
	exit 1
fi
echo -n '<img src="data:image/png;base64,' ; base64 "$fn" | tr -d '\n' ; echo '">'

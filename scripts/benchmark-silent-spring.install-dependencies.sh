#!/bin/sh

for d in ./../benchmark-silent-spring/*/ ; do (cd "$d" && echo "$PWD" && npm install); done


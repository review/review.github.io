#!/usr/bin/env bash

rm -r dist
git rm *.js *.map
parcel build index.html
mv dist/* .
git add *.js *.map
git commit -am "New build and add."
git push -u origin master

#!/usr/bin/env bash

rm -rf dist *.js *.map *.html
parcel build index.html
cp dist/* .

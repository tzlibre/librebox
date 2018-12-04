#!/usr/bin/env bash
npm run build
rsync -av $(pwd)/dist/ raul@santiago:/home/raul/libre-box-staging/

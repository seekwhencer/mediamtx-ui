#!/usr/bin/env bash

cp .env.example .env
cp config/mediamtx.default.yml config/mediamtx.yml
mkdir data
touch data/cam1.json

echo "Now edit the .env and mediamtx.yml files as needed."
echo "Then run 'docker compose build --no-cache' to build the docker image"
echo "Then run 'docker compose -f mediamtx.yml up -d' to start the streaming server in detached mode."
echo "... and 'docker compose up -d' to start the streaming application in detached mode."
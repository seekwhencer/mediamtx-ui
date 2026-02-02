#!/usr/bin/env bash

cp .env.example .env
cp config/mediamtx.default.yml config/mediamtx.yml
cp config/auth.default.json config/auth.json
mkdir data
touch data/cam1.json

echo "Now edit the .env and mediamtx.yml files as needed."
echo "Then run 'docker compose build' to build the docker image."
echo "Then run 'docker compose -f docker-compose-mediamtx.yml up -d' to start the streaming server in detached mode."
echo "... and 'docker compose up -d' to start the streaming application in detached mode."
#!/bin/bash
set -e

# Xvfb starten
rm -f /tmp/.X99-lock
Xvfb :99 -screen 0 1920x1080x24 -ac +extension GLX +render -noreset &
sleep 1

# Chromium starten (NICHT headless)
chromium \
  --no-sandbox \
  --disable-software-rasterizer \
  --disable-extensions \
  --disable-dev-shm-usage \
  --disable-gpu \
  --window-size=1920,1080 \
  --hide-scrollbars \
  --autoplay-policy=no-user-gesture-required \
  --disable-session-crashed-bubble \
  --no-default-browser-check \
  --kiosk \
  --disable-infobars \
  --disable-extensions \
  --no-first-run \
  --no-default-browser-check \
  --user-data-dir=/tmp/chrome-profile \
  --disable-translate \
  --disable-features=TranslateUI,Translate \
  http://mediamtxui:3000 &

# ffmpeg Stream (RTMP Beispiel)
#ffmpeg -f x11grab -s 1920x1080 -r 25 -i :99.0 \
#  -c:v rawvideo -pix_fmt yuv420p \
#  -f rtp rtp://mediamtx:8554/browser

ffmpeg -f x11grab -s 1920x1080 -r 25 -i :99.0 -c:v h264_v4l2m2m -b:v 3M -tune zerolatency -pix_fmt yuv420p -rtsp_transport tcp -f rtsp rtsp://mediamtx:8554/browser

#ffmpeg \
#  -f x11grab \
#  -video_size 1280x720 \
#  -framerate 30 \
#  -i :99.0 \
#  -f lavfi -i anullsrc \
#  -c:v libx264 -preset ultrafast -tune zerolatency \
#  -pix_fmt yuv420p \
#  -shortest \
#  -f flv rtmp://server/app/streamkey

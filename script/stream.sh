#!/bin/bash

# for testing
CAM1_NAME=one
CAM1_DEVICE=/dev/video0
CAM1_RTSP_PATH=cam2
CAM1_VIDEO_SIZE=1280x720
CAM1_FRAMERATE=25
CAM1_BITRATE=3M

CAM2_NAME=two
CAM2_DEVICE=/dev/video2
CAM2_RTSP_PATH=cam3
CAM2_VIDEO_SIZE=1280x720
CAM2_FRAMERATE=25
CAM2_BITRATE=3M

CAM3_NAME=three
CAM3_DEVICE=/dev/video4
CAM3_RTSP_PATH=cam4
CAM3_VIDEO_SIZE=1280x720
CAM3_FRAMERATE=25
CAM3_BITRATE=3M

loadConfig() {
  DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  export $(egrep -v '^#' "${DIR}/.env" | xargs)
}

listDevices() {
  v4l2-ctl --list-devices
}

listFormats() {
  local DEVICE="${1}"
  ffmpeg -hide_banner -f v4l2 -list_formats all -i $DEVICE
}

listControls() {
  local DEVICE="${1}"
  v4l2-ctl -d $DEVICE --list-ctrls
}

resetCamera() {
  local DEVICE="${1}"

  v4l2-ctl -d $DEVICE \
    --set-ctrl=brightness=133 \
    --set-ctrl=contrast=5 \
    --set-ctrl=saturation=83 \
    --set-ctrl=white_balance_automatic=1 \
    --set-ctrl=power_line_frequency=1 \
    --set-ctrl=sharpness=25 \
    --set-ctrl=backlight_compensation=0 \
    --set-ctrl=auto_exposure=1 \
    --set-ctrl=exposure_time_absolute=156 \
    --set-ctrl=pan_absolute=0 \
    --set-ctrl=tilt_absolute=0 \
    --set-ctrl=zoom_absolute=0

    # --set-ctrl=white_balance_temperature=4500 \
}

stream() {
  local DEVICE=${1:-/dev/video0}
  local STREAM_NAME=${2:-cam2}
  local VIDEO_SIZE=${3:-1280x800}
  local FPS=${4:-25}
  local BITRATE=${5:-2M}
  local FORMAT="mjpeg"

  ffmpeg -hide_banner -f v4l2 \
      -input_format "$FORMAT" \
      -video_size "$VIDEO_SIZE" \
      -framerate "$FPS" \
      -i "$DEVICE" \
      -vf "drawtext=fontfile=/path/to/font.ttf:text='%{localtime\:%Y-%m-%d %H\\\\\:%M\\\\\:%S}':x=10:y=10:fontsize=24:fontcolor=white:box=1:boxcolor=0x00000099"\
      -c:v h264_v4l2m2m -b:v "$BITRATE" -tune zerolatency -flags low_delay \
      -pix_fmt yuv420p \
      -g "$FPS" -keyint_min "$FPS" -r "$FPS" \
      -max_muxing_queue_size 4096 \
      -fflags nobuffer -flush_packets 0 \
      -f rtsp -rtsp_transport tcp \
      "rtsp://${RTSP_HOST}:${RTSP_PORT}/$STREAM_NAME"
}

#-----------------------------------------------------------------------------------

# load .env file
loadConfig

# list all available devices
listDevices

# list all formats of each camera
listFormats "${CAM1_DEVICE}"
listFormats "${CAM2_DEVICE}"
listFormats "${CAM3_DEVICE}"

# reset all cameras to default settings
resetCamera "${CAM1_DEVICE}"
resetCamera "${CAM2_DEVICE}"
resetCamera "${CAM3_DEVICE}"

# start streaming all cameras
stream "${CAM1_DEVICE}" "${CAM1_RTSP_PATH}" "${CAM1_VIDEO_SIZE}" "${CAM1_FRAMERATE}" "${CAM1_BITRATE}" &
stream "${CAM2_DEVICE}" "${CAM2_RTSP_PATH}" "${CAM2_VIDEO_SIZE}" "${CAM2_FRAMERATE}" "${CAM2_BITRATE}" &
stream "${CAM3_DEVICE}" "${CAM3_RTSP_PATH}" "${CAM3_VIDEO_SIZE}" "${CAM3_FRAMERATE}" "${CAM3_BITRATE}"

killall ffmpeg

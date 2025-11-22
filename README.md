# 🎥raspicam-ffmpeg-streaming
Stream and transcode hardware encoded 3 (or maybe 4) webcams on a Raspberry Pi4.  
Orchestrated with node.js with a tiny web frontend.

## 🡆 Prerequisites
- set up you raspberry pi 4 or 5 (expand filesystem, locale)
- plug you webcams (don't forget the external powered usb-hub)
- install ffmpeg bare metal
```bash
sudo apt-get update -y
sudo apt-get install git curl ffmpeg -y
```

- install Docker
```bash
cd ~
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh ./get-docker.sh
```

## 🡆 Get the repository
```bash
git clone https://github.com/seekwhencer/raspicam-ffmpeg-streaming.git raspicam
cd raspicam

# build the image
docker compose build --no-cache
```

## 🡆 Configure
- create a folder `data/`
- place `json` files in there. name it like you want.json.
- one file for one camera: `cam1.json` for example
```json
{
  "name": "webcam one",
  "device": "/dev/video0",
  "input_format": "mjpeg",
  "rtsp_host": "YOUR_MEDIAMTX_IP",
  "rtsp_port": "8554",
  "rtsp_path": "cam1",
  "size": "1280x720",
  "framerate": 25,
  "bitrate": "3M"
}
```

## 🡆 Run
```bash
# with shell
docker compose up

# or detached
docker compose up -d
```
- oh wait, only the conrainer is up... just enter
```bash
docker exec rapsicam /bin/sh -c "node ./index.js"
```


Now the Webserver is up on Port: `3000` 🡆 **[http://raspicam:3000](http://raspicam:3000)**
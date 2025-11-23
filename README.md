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
- mediamtx server
```bash
# mediamtx server
cd ~/caspicam
docker compose -f docker-compose-mediamtx.yml up -d
```

- the ffmpeg streaming
```bash
# with shell
docker compose up

# or detached
docker compose up -d
```

## 🡆 Hints
- the Raspberry Pi 4 can handle 3 webcams in 2MP with 3Mbit bitrate each (or more?)
- for more than 3 webcams you need to lower the resolution or framerate
- the webcams needs a external powered usb-hub
- make sure the webcams are using hardware encoding (mjpeg or h264)
- access the web interface on port 3000 of your raspberry pi
- access the rtsp streams with your favorite player (vlc, ffplay, etc) or use the web interface
- example rtsp url: `rtsp://YOUR_MEDIAMTX_IP:8554/cam1`
- example WebRTC url: `http://YOUR_MEDIAMTX_IP:8554/cam1`
- example HLS url: `http://YOUR_MEDIAMTX_IP:8554/cam1/index.m3u8`



Now the Webserver is up on Port: `3000` 🡆 **[http://raspicam:3000](http://raspicam:3000)**
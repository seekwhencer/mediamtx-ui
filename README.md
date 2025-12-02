# 🎥raspicam-ffmpeg-streaming
Originally it was an FFmpeg orchestrator with a web UI. Now it’s becoming a dashboard for MediaMTX. The repository name no longer fits, so I’ll probably rename it.


![Screenshot #1](../master/screenshots/screenshot_01.png?raw=true "Screenshot #1")

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
### Webcams
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

### Mediamtx
- duplicate mediamtx configuration
```bash
    cp mediamtx.default.yml mediamtx.yml
```
- edit `mediamtx.yml` if needed (default ports are fine)
### Environment
- duplicate `.env` configuration
```bash
    cp .env.default .env
```
- edit `.env` if needed (default ports are fine)

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

![Screenshot #2](../master/screenshots/screenshot_02.png?raw=true "Screenshot #2")
![Screenshot #3](../master/screenshots/screenshot_03.png?raw=true "Screenshot #3")
![Screenshot #4](../master/screenshots/screenshot_04.png?raw=true "Screenshot #4")
![Screenshot #5](../master/screenshots/screenshot_05.png?raw=true "Screenshot #5")
![Screenshot #6](../master/screenshots/screenshot_06.png?raw=true "Screenshot #6")
![Screenshot #7](../master/screenshots/screenshot_07.png?raw=true "Screenshot #7")
![Screenshot #8](../master/screenshots/screenshot_08.png?raw=true "Screenshot #8")
![Screenshot #9](../master/screenshots/screenshot_09.png?raw=true "Screenshot #9")

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

## 🡆 DONE
- api proxy
- state structure
- state flow
- server structure
- routes
- settings as proxy object, emitting events
- events + ejecters
- fail safe inputs by resetting the fields to their previous working values

## 🡆 TODO
- path defaults
- user management
- paths
- source management
- 
# 🎥mediamtx-ui
Configure your mediamtx server per web ui.

![Screenshot Global Options](../master/screenshots/screenshot_01.png?raw=true "Screenshot Global Options")
![Screenshot Paths](../master/screenshots/screenshot_10.png?raw=true "Screenshot Paths")
![Screenshot Path Defaults](../master/screenshots/screenshot_12.png?raw=true "Screenshot Path Defaults")
![Screenshot Users](../master/screenshots/screenshot_17.png?raw=true "Screenshot Users")

## 🡆 Prerequisites
install Docker
```bash
cd ~
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh ./get-docker.sh
```

## 🡆 Get the repository
```bash
git clone https://github.com/seekwhencer/mediamtx-ui.git
cd mediamtx-ui

# build the image
docker compose build --no-cache
```

## 🡆 Configure
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
![Screenshot #10](../master/screenshots/screenshot_10.png?raw=true "Screenshot #10")
![Screenshot #11](../master/screenshots/screenshot_11.png?raw=true "Screenshot #11")
![Screenshot #12](../master/screenshots/screenshot_12.png?raw=true "Screenshot #12")
![Screenshot #13](../master/screenshots/screenshot_13.png?raw=true "Screenshot #13")
![Screenshot #14](../master/screenshots/screenshot_14.png?raw=true "Screenshot #14")
![Screenshot #15](../master/screenshots/screenshot_15.png?raw=true "Screenshot #15")
![Screenshot #16](../master/screenshots/screenshot_16.png?raw=true "Screenshot #16")
![Screenshot #17](../master/screenshots/screenshot_16.png?raw=true "Screenshot #17")

## 🡆 Hints
- set up you raspberry pi 4 or 5 (expand filesystem, locale)
- plug you webcams (don't forget the external powered usb-hub)
- install ffmpeg bare metal (this is at the moment the only way to use hardware encoding inside the docker container on a raspberry pi 4+)
```bash
sudo apt-get update -y
sudo apt-get install git curl ffmpeg -y
```
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
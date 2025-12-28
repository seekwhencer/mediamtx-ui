# 🎥mediamtx-ui
Configure your [mediamtx server](https://mediamtx.org/) with this dependency free (so far) web ui.
- It is running in a dockerized setup.
- The UI has it's own webserver, running in a separate container.  
- Tested on a Raspberry pi 4.
- At the moment: don't use it reachable from the web. Use it only in a lan scenario.

> This example setup works perfectly in a local scenario. Don't make it reachable from the web.

## 🡆 Features (at the moment)
- change ALL(!) **server** properties at runtime
- change all **path defaults** at runtime
- add, edit, delete **users** at runtime
- add, edit, delete **paths** (streams) with all of their properties at runtime
- persist changes by writing a new yaml
- view the streams in the browser (chrome, firefox - yes, firefox)
- authentication for the frontend
- dockerized setup for a local scenario

## 🡆 Features (future)
- orchestrate mediamtx by node.js (to reload the config or load other configurations)
- config switcher (chose between different configurations)
- source management
- add, edit, delete (manage) local usb devices with ffmpeg
- change usb camera properties (brightness, auto exposure, ...)
- ... what else?


![Screenshot Overview](https://raw.githubusercontent.com/seekwhencer/mediamtx-ui/refs/heads/master/screenshots/screenshot_1.png?raw=true "Screenshot Overview")
- Top Left: RTSP IP Cam Stream
- Top Middle: Raspi (A) USB Webcam 1
- Top Right: Raspi (A) USB Webcam 2
- Bottom Left: Raspi (A) USB Webcam 3
- Bottom Middle: RTMP Stream from OBS Studio
- Bottom Right: Raspi (B) Elgato Cam Link 4K Stream from DSLR-Camera (second local mediaMTX server)

![Screenshot Global Options](https://raw.githubusercontent.com/seekwhencer/mediamtx-ui/refs/heads/master/screenshots/screenshot_01.png?raw=true "Screenshot Global Options")
![Screenshot Paths](https://raw.githubusercontent.com/seekwhencer/mediamtx-ui/refs/heads/master/screenshots/screenshot_10.png?raw=true "Screenshot Paths")
![Screenshot Path Defaults](https://raw.githubusercontent.com/seekwhencer/mediamtx-ui/refs/heads/master/screenshots/screenshot_15.png?raw=true "Screenshot Path Defaults")
![Screenshot Users](https://raw.githubusercontent.com/seekwhencer/mediamtx-ui/refs/heads/master/screenshots/screenshot_20.png?raw=true "Screenshot Users")

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
cp config/mediamtx.default.yml config/mediamtx.yml
```
- edit `mediamtx.yml` if needed (default ports are fine)
### Environment
- duplicate `.env` configuration
```bash
cp .env.default .env
```
- edit `.env` if needed (default ports are fine)

### Authentication
Create an argon2 hashed password.  
To do this, run the container once:
```bash
docker compose run -it mediamtxui node generate_auth.js
```
- copy / paste the resulting hash into the `config/auth.json` file, like:
```bash
cp config/auth.default.json config/auth.json
```
```json
{
  "username": "$argon2id$v=19$m=65536,t=3,p=4$TWxdvA/ofnjj6NzisE8P5Q$jzkY3Y01Trie9sJMuGwdGxRJSi9+YjN2UxJlafztT18",
  "password": "$argon2id$v=19$m=65536,t=3,p=4$TWxdvA/ofnjj6NzisE8P5Q$jzkY3Y01Trie9sJMuGwdGxRJSi9+YjN2UxJlafztT18"
}

```


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

![Screenshot Login](../master/screenshots/screenshot_login.png?raw=true "Screenshot Login")
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
![Screenshot #18](../master/screenshots/screenshot_18.png?raw=true "Screenshot #18")
![Screenshot #19](../master/screenshots/screenshot_19.png?raw=true "Screenshot #19")
![Screenshot #20](../master/screenshots/screenshot_20.png?raw=true "Screenshot #20")

This setup is running on a Raspberry Pi 4 with 4GB ram. No Joke.  
My testing and development setup is still outside at 0°C with some rain.  
I have been plugged three cheap webcams on the Rpi. The Rpi is transcoding all three cams - hardware accelerated with ffmpeg.  
The mediaMTX server is getting one RTSP stream from an IP cam and these three streams. And it worked.   

The first need to do that was coming with the three hedgehogs in our garden.
Every year we nurse several young hedgehogs over the winter, which we receive from the wildlife rescue service and then release into the wild in the spring.

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

## 🡆 @TODO
### Feature
- source management
- recording
- playback
- storage management for the recordings
 
### Server
- override config props from env vars (coming from compose file)
- locking props from env vars
- as metrics bridge to the influxdb

### Frontend
- hooks as textarea
- login
- responsive
- locked props

### Infrastructure
- influxdb 2
- grafana

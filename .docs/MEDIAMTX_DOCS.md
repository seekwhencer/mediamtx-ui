# MediaMTX Documentation

> Full documentation crawled from https://mediamtx.org/docs (fetched 2026-10-26).

> 73 pages, one file.


---

<!-- source: https://mediamtx.org/docs/kickoff/introduction -->

# Introduction

Welcome to the MediaMTX documentation!

*MediaMTX* is a ready-to-use and zero-dependency live media server and media proxy that allows to publish, read, proxy, record and playback real-time video and audio streams. It has been conceived as a “media router” that routes media streams from one end to the other, with a focus on efficiency and portability.

Main features:

- [Publish streams](https://mediamtx.org/docs/features/publish-and-read) to the server with Media-over-QUIC, SRT, WebRTC, RTSP, RTMP, HLS, MPEG-TS, RTP, using FFmpeg, GStreamer, OBS Studio, Python , Golang, Unity, Web browsers, Raspberry Pi Cameras and more.
- [Read streams](https://mediamtx.org/docs/features/publish-and-read) from the server with Media-over-QUIC, SRT, WebRTC, RTSP, RTMP, HLS, using FFmpeg, GStreamer, VLC, OBS Studio, Python , Golang, Unity, Web browsers and more.
- Streams are automatically converted from a protocol to another
- Serve several streams at once in separate paths
- Reload the configuration without disconnecting existing clients (hot reloading)
- [Serve always-available streams](https://mediamtx.org/docs/features/always-available) even when the publisher is offline
- [Record streams](https://mediamtx.org/docs/features/record) to disk in fMP4 or MPEG-TS format
- [Playback recorded streams](https://mediamtx.org/docs/features/playback) from disk
- [Authenticate](https://mediamtx.org/docs/features/authentication) users with internal, HTTP or JWT authentication
- [Forward streams](https://mediamtx.org/docs/features/forward) to other servers
- [Proxy requests](https://mediamtx.org/docs/features/proxy) to other servers
- [Control](https://mediamtx.org/docs/features/control-api) the server through the Control API
- [Extract metrics](https://mediamtx.org/docs/features/metrics) from the server in a Prometheus-compatible format
- [Monitor performance](https://mediamtx.org/docs/features/performance) to investigate CPU and RAM consumption
- [Run hooks](https://mediamtx.org/docs/features/hooks) (external commands) when clients connect, disconnect, read or publish streams
- Compatible with Linux, Windows and macOS, does not require any dependency or interpreter, it’s a single executable

You can learn more about how everything is assembled in [Architecture](https://mediamtx.org/docs/features/architecture).

Use the menu to navigate through the documentation.


---

<!-- source: https://mediamtx.org/docs/kickoff/install -->

# Install

There are several installation methods available:

- Standalone binary: use this if you are running Windows, macOS or you just want to try out *MediaMTX*.
- Docker container: use this if you want to run *MediaMTX* in an isolated and deterministic way. This is recommended for production environments.
- Arch Linux package: use this if you are running Arch Linux.
- FreeBSD package: use this if you are running FreeBSD.
- OpenWrt binary: use this if you are running OpenWrt.

## Standalone binary

1. Visit the [Releases page](https://github.com/bluenviron/mediamtx/releases) on GitHub, download and extract a standalone binary that corresponds to your operating system and architecture (example: `mediamtx_v1.21.3_linux_amd64.tar.gz`).
2. Start the server by double clicking on `mediamtx` (`mediamtx.exe` on Windows) or writing in the terminal:`./mediamtx`

## Docker container

Download and launch the `bluenviron/mediamtx:1` image with the following environment variables and ports:

```
docker run --rm -it \
-e MTX_RTSPTRANSPORTS=tcp \
-e MTX_WEBRTCADDITIONALHOSTS=192.168.x.x \
-p 8554:8554 \
-p 1935:1935 \
-p 8888:8888 \
-p 8889:8889 \
-p 8892:8892 \
-p 8890:8890/udp \
-p 8189:8189/udp \
-p 8892:8892/udp \
-p 8893:8893/udp \
bluenviron/mediamtx:1
```

Fill the `MTX_WEBRTCADDITIONALHOSTS` environment variable with the IP that will be used to connect to the server.

The `MTX_RTSPTRANSPORTS=tcp` environment variable is meant to disable the UDP transport protocol of the RTSP server (which requires the real IP address and port of incoming UDP packets, that are sometimes replaced by the Docker network stack). If you want to use it, you need to bypass the Docker network stack through the `--network=host` flag (which is not compatible with Windows, macOS and Kubernetes):

```
docker run --rm -it --network=host bluenviron/mediamtx:1
```

There are four image variants:

| name | FFmpeg included | RPI Camera support |
|---|---|---|
| bluenviron/mediamtx:1 | ❌ | ❌ |
| bluenviron/mediamtx:1-ffmpeg | ✔️ | ❌ |
| bluenviron/mediamtx:1-rpi | ❌ | ✔️ |
| bluenviron/mediamtx:1-ffmpeg-rpi | ✔️ | ✔️ |

The `1` tag corresponds to the latest `1.x.x` release, that should guarantee backward compatibility when upgrading. It is also possible to bind the image to a specific release, by using the release name as tag (`bluenviron/mediamtx:1.21.3`).

The base image does not contain any utility, in order to minimize size and frequency of updates. If you need additional software (like curl, wget, GStreamer), you can build a custom image by creating a file named `Dockerfile` with this content:

```
FROM bluenviron/mediamtx:1 AS mediamtx

# pick any Linux-based operating system you want.
FROM ubuntu:24.04

COPY --from=mediamtx /mediamtx /
COPY --from=mediamtx /mediamtx.yml /

# add anything you need, GStreamer is just an example.
RUN apt update && apt install -y \
   gstreamer1.0-tools

ENTRYPOINT [ "/mediamtx" ]
```

And then build it:

```
docker build . -t my-mediamtx
```

## Arch Linux package

If you are running the Arch Linux distribution, launch:

```
git clone https://aur.archlinux.org/mediamtx.git
cd mediamtx
makepkg -si
```

## FreeBSD package

Available via ports tree or using packages (2025Q2 and later) as listed below:

```
cd /usr/ports/multimedia/mediamtx && make install clean
pkg install mediamtx
```

## OpenWrt binary

If the architecture of the OpenWrt device is amd64, armv6, armv7 or arm64, use the standalone binary method and download a Linux binary that corresponds to your architecture.

Otherwise, [compile the server from source](https://mediamtx.org/docs/misc/compile).


---

<!-- source: https://mediamtx.org/docs/kickoff/upgrade -->

# Upgrade

If you have an existing *MediaMTX* installation, you can upgrade it to the latest version. The procedure depends on how *MediaMTX* was installed.

## Standalone binary

The standalone binary comes with an upgrade utility that can be launched with:

```
./mediamtx --upgrade
```

This will replace the *MediaMTX* executable with its latest version. Privileges to write to the executable location are required.

## Docker container

Stop and remove the container:

```
docker stop id-of-mediamtx-container
docker rm id-of-mediamtx-container
```

Remove the *MediaMTX* image from cache:

```
docker rm bluenviron/mediamtx:1
```

Then recreate the container as described in [Install](https://mediamtx.org/docs/kickoff/install#docker-container).

## Arch Linux package

Repeat the installation procedure.

## FreeBSD package

Repeat the installation procedure.

## OpenWrt binary

If the architecture of the OpenWrt device is amd64, armv6, armv7 or arm64, you can use the standalone binary method.

Otherwise, recompile the server from source.


---

<!-- source: https://mediamtx.org/docs/features/basic-usage -->

# Basic usage

1. [Publish](https://mediamtx.org/docs/features/publish-and-read) a stream. For instance, you can publish a stream from a MP4 file with *FFmpeg* and the RTSP protocol:`ffmpeg -re -stream_loop -1 -i file.mp4 -c copy \ -f rtsp rtsp://localhost:8554/mystream`or *GStreamer*:`gst-launch-1.0 rtspclientsink name=s location=rtsp://localhost:8554/mystream filesrc location=file.mp4 \ ! qtdemux name=d d.video_0 ! queue ! s.sink_0 d.audio_0 ! queue ! s.sink_1`
2. [Read](https://mediamtx.org/docs/features/publish-and-read) the stream. For instance, you can read the stream with *VLC* and the RTSP protocol:`vlc --network-caching=50 rtsp://localhost:8554/mystream`or *GStreamer*:`gst-play-1.0 rtsp://localhost:8554/mystream`or *FFmpeg*:`ffmpeg -i rtsp://localhost:8554/mystream -c copy output.mp4`


---

<!-- source: https://mediamtx.org/docs/features/architecture -->

# Architecture

![architecture](/assets/architecture.D2-TKDmV_1pcU9I.svg)

## Live streams

The main purpose of *MediaMTX* is to serve real-time media streams. Each stream is mapped to a unique *Path*, for instance there can be a stream on path `/stream1` and a different one on `/stream2`.

Streams can be [published and read](https://mediamtx.org/docs/features/publish-and-read) by using a client that connects to *MediaMTX* and communicates through a protocol, or even by using *MediaMTX* as the client that connects to an existing server and pulls the stream (*Static sources*).

## Recorder

Streams ingested into *MediaMTX* can be passed to a recorder to [record their content to disk](https://mediamtx.org/docs/features/record).

## Playback server

Recordings produced by the recorded can be served back to users through the [playback server](https://mediamtx.org/docs/features/playback).

## Forward destinations

Streams ingested into *MediaMTX* can be forwarded to other servers by using [forward destinations](https://mediamtx.org/docs/features/forward).

## Administrative utilities

*MediaMTX* provides some utilities that are meant to be used by administrators to monitor and control the software:

- The [Control API](https://mediamtx.org/docs/features/control-api), that offers an API to query and change the configuration and the state of the server.
- The [Metrics server](https://mediamtx.org/docs/features/metrics), that serves metrics in a standard format.
- The [Pprof server](https://mediamtx.org/docs/features/performance) that allows to extract CPU and memory usage.


---

<!-- source: https://mediamtx.org/docs/features/publish-and-read -->

# Publish and read streams

Live streams can be published or read by using a client (software) that connects to *MediaMTX* and communicates through a protocol.

Many protocols are available for publishing and reading real-time streams because different industries developed streaming technology at different times and for different purposes (security, web streaming, TV broadcasting). In *MediaMTX*, streams are not tied to a specific protocol: they can be published with one protocol and read with another. Conversion is effortless and automatic.

Streams can also be ingested as *Static sources*, in which *MediaMTX* acts as the client and pulls streams from other servers.

These are the protocols that are currently supported and their capabilities (publish / static source / read):

- Media-over-QUIC ([publish](https://mediamtx.org/docs/publish/moq), [static source](https://mediamtx.org/docs/static-sources/moq), [read](https://mediamtx.org/docs/read/moq)): a new generation streaming protocol based on QUIC, HTTP/3 and browser APIs. *MediaMTX* listens for incoming clients on ports `8892/TCP` and `8893/UDP` and is capable of pulling streams from other servers.
- WebRTC ([publish](https://mediamtx.org/docs/publish/webrtc), [static source](https://mediamtx.org/docs/static-sources/webrtc), [read](https://mediamtx.org/docs/read/webrtc)): a streaming protocol based on a set of ready-to-use browser APIs. *MediaMTX* listens for incoming clients on ports `8889/TCP`, `8189/UDP` and is capable of pulling streams from other servers.
- RTSP ([publish](https://mediamtx.org/docs/publish/rtsp), [static source](https://mediamtx.org/docs/static-sources/rtsp), [read](https://mediamtx.org/docs/read/rtsp)): the streaming protocol used by most IP cameras. *MediaMTX* listens for incoming clients on port `:8554/TCP` (and uses `:8000/UDP` and `:8001/UDP` under the hood) and is capable of pulling streams from other servers.
- RTMP ([publish](https://mediamtx.org/docs/publish/rtmp), [static source](https://mediamtx.org/docs/static-sources/rtmp), [read](https://mediamtx.org/docs/read/rtmp)): streaming protocol used mostly for publishing live streams to broadcast websites. *MediaMTX* listens for incoming clients on port `:1935/TCP` and is capable of pulling streams from other servers.
- SRT ([publish](https://mediamtx.org/docs/publish/srt), [static source](https://mediamtx.org/docs/static-sources/srt), [read](https://mediamtx.org/docs/read/srt)): a streaming protocol developed for robustness and precise timing for the enterprise broadcasting industry. *MediaMTX* listens for incoming clients on port `8890/UDP` and is capable of pulling streams from other servers.
- HLS ([static source](https://mediamtx.org/docs/static-sources/hls), [read](https://mediamtx.org/docs/read/hls)): a streaming protocol based on files (segments) served through an HTTP server, suitable for reading streams on websites. *MediaMTX* listens for incoming clients on port `8888/TCP`.
- MPEG-TS ([static source](https://mediamtx.org/docs/static-sources/mpeg-ts)): a packet format used for TV broadcasting. *MediaMTX* is capable of pulling MPEG-TS packets from an IP address.
- RTP ([static source](https://mediamtx.org/docs/static-sources/rtp)): a packet format used for IP streaming. *MediaMTX* is capable of pulling RTP streams from an IP address.

We also provide instructions for ingesting streams from some devices:

- [Raspberry Pi Cameras](https://mediamtx.org/docs/static-sources/raspberry-pi-cameras)
- [Generic webcams](https://mediamtx.org/docs/publish/generic-webcams)

We also provide instructions for publishing streams with specific software:

- [Web browsers](https://mediamtx.org/docs/publish/web-browsers)
- [FFmpeg](https://mediamtx.org/docs/publish/ffmpeg)
- [GStreamer](https://mediamtx.org/docs/publish/gstreamer)
- [OBS Studio](https://mediamtx.org/docs/publish/obs-studio)
- [Python and OpenCV](https://mediamtx.org/docs/publish/python-opencv)
- [Golang](https://mediamtx.org/docs/publish/golang)
- [Unity](https://mediamtx.org/docs/publish/unity)

We also provide instructions for reading streams with specific software:

- [Web browsers](https://mediamtx.org/docs/read/web-browsers)
- [FFmpeg](https://mediamtx.org/docs/read/ffmpeg)
- [GStreamer](https://mediamtx.org/docs/read/gstreamer)
- [VLC](https://mediamtx.org/docs/read/vlc)
- [OBS Studio](https://mediamtx.org/docs/read/obs-studio)
- [Python and OpenCV](https://mediamtx.org/docs/read/python-opencv)
- [Golang](https://mediamtx.org/docs/read/golang)
- [Unity](https://mediamtx.org/docs/read/unity)

**Which protocol(s) should i use?**

There isn’t a single answer to this question; it depends on the specific use case. Think about the overall system you want to implement, from the source to the final destination.

If the source is an IP camera, you probably want to use the protocol offered by the camera (RTSP, RTMP). If the source is broadcasting software, you might want to use its native protocol (RTMP, WebRTC, SRT). If the source is a user connected to your website through a browser, you might want to use a browser-native protocol (Media-over-QUIC, WebRTC).

The protocols used by readers are often different from the one used to publish the stream, and the choice depends on the intended audience. If readers are users connected through a website, you might want to use a browser-native protocol (Media-over-QUIC, WebRTC). If you need to serve a large number of readers, you might want to consider HLS.

In any case, the protocol is not a constraint and can be changed at any time by switching the client and target port.


---

<!-- source: https://mediamtx.org/docs/features/configuration -->

# Configuration

*MediaMTX* can be configured through parameters that are listed and commented in the [configuration file](https://mediamtx.org/docs/references/configuration-file) (`mediamtx.yml`).

## Change the configuration

There are several ways to change configuration parameters:

1. Edit the configuration file.When installing the server as a [standalone binary](https://mediamtx.org/docs/kickoff/install#standalone-binary), the configuration file is included into the release bundle.When installing the server as a [Docker container](https://mediamtx.org/docs/kickoff/install#docker-container), you need to download the configuration file in a local folder, mount the folder and point `MediaMTX` to the file in the folder:`mkdir mediamtx-config wget https://raw.githubusercontent.com/bluenviron/mediamtx/v1.21.3/mediamtx.yml -O mediamtx-config/mediamtx.yml docker run --rm -it \ -p 8554:8554 \ -p 1935:1935 \ -p 8888:8888 \ -p 8889:8889 \ -p 8892:8892 \ -p 8890:8890/udp \ -p 8189:8189/udp \ -p 8892:8892/udp \ -p 8893:8893/udp \ -v "$PWD/mediamtx-config:/etc/mediamtx" \ -w /etc/mediamtx \ bluenviron/mediamtx:1 ./mediamtx.yml`You can edit the configuration file when the server is running (hot reloading). Changes are detected and applied without disconnecting existing clients, whenever it’s possible.
2. Use environment variables, in the format `MTX_PARAMNAME`, where `PARAMNAME` is the uppercase name of a parameter. For instance, the `rtspAddress` parameter can be overridden in the following way:`MTX_RTSPADDRESS="127.0.0.1:8554" ./mediamtx`Parameters that have array as value can be overridden by setting a comma-separated list. For example:`MTX_RTSPTRANSPORTS="tcp,udp"`Parameters in maps can be overridden by using underscores, in the following way:`MTX_PATHS_TEST_SOURCE=rtsp://myurl ./mediamtx`Parameters in lists can be overridden in the same way as parameters in maps, using their position like an additional key. This is particularly useful if you want to use internal users but define credentials through environment variables:`MTX_AUTHINTERNALUSERS_0_USER=username MTX_AUTHINTERNALUSERS_0_PASS=password`This method is particularly useful when using Docker; any configuration parameter can be changed by passing environment variables with the `-e` flag:`docker run --rm -it \ --network=host \ -e MTX_PATHS_TEST_SOURCE=rtsp://myurl \ bluenviron/mediamtx:1`
3. Use the [Control API](https://mediamtx.org/docs/features/control-api).

## Validate the configuration

You can validate a configuration file without starting the server:

```
./mediamtx --validate-conf=/path/to/mediamtx.yml
```

## Encrypt the configuration

The configuration file can be entirely encrypted for security purposes by using the `crypto_secretbox` function of the NaCL library. An online tool for performing this operation is [available here](https://play.golang.org/p/rX29jwObNe4).

After performing the encryption, put the base64-encoded result into the configuration file, and launch the server with the `MTX_CONFKEY` variable:

```
MTX_CONFKEY=mykey ./mediamtx
```


---

<!-- source: https://mediamtx.org/docs/features/authentication -->

# Authentication

*MediaMTX* can be configured to ask clients for credentials, either in the form of username/password or a string-based token. These credentials are then validated through a chosen method.

## Validate credentials

Credentials can be validated through one of these methods:

- Internal database: credentials are stored in the configuration file
- External HTTP server: an external HTTP URL is contacted for each authentication request
- External JWT provider: credentials are signed tokens released by an external identity server

### Internal database

The internal authentication method is the default one. Users are stored inside the configuration file, in this format:

```
authInternalUsers:
  # Username. 'any' means any user, including anonymous ones.
  - user: any
    # Password. Not used in case of 'any' user.
    pass:
    # IPs or networks allowed to use this user. An empty list means any IP.
    ips: []
    # Permissions.
    permissions:
      # Available actions are: publish, read, playback, api, metrics, pprof.
      - action: publish
        # Paths can be set to further restrict access to a specific path.
        # An empty path means any path.
        # Regular expressions can be used by using a tilde as prefix.
        path:
      - action: read
        path:
      - action: playback
        path:
```

Only clients that provide a valid username and password will be able to perform a certain action.

If storing plain credentials in the configuration file is a security problem, username and passwords can be stored as hashed strings. The Argon2 and SHA256 hashing algorithms are supported. To use Argon2, the string must be hashed using Argon2id (recommended) or Argon2i:

```
echo -n "mypass" | argon2 saltItWithSalt -id -l 32 -e
```

Then stored with the `argon2:` prefix:

```
authInternalUsers:
  - user: argon2:$argon2id$v=19$m=4096,t=3,p=1$MTIzNDU2Nzg$OGGO0eCMN0ievb4YGSzvS/H+Vajx1pcbUmtLp2tRqRU
    pass: argon2:$argon2i$v=19$m=4096,t=3,p=1$MTIzNDU2Nzg$oct3kOiFywTdDdt19kT07hdvmsPTvt9zxAUho2DLqZw
    permissions:
      - action: publish
```

To use SHA256, the string must be hashed with SHA256 and encoded with base64:

```
echo -n "mypass" | openssl dgst -binary -sha256 | openssl base64
```

Then stored with the `sha256:` prefix:

```
authInternalUsers:
  - user: sha256:j1tsRqDEw9xvq/D7/9tMx6Jh/jMhk3UfjwIB2f1zgMo=
    pass: sha256:BdSWkrdV+ZxFBLUQQY7+7uv9RmiSVA8nrPmjGjJtZQQ=
    permissions:
      - action: publish
```

**WARNING**: enable encryption or use a VPN to ensure that no one is intercepting the credentials in transit.

### External HTTP server

Authentication can be delegated to an external HTTP server:

```
authMethod: http
authHTTPAddress: http://myauthserver/auth
```

Each time a user needs to be authenticated, the specified URL will be requested with the POST method and this payload:

```
{
  "user": "user",
  "password": "password",
  "token": "token",
  "ip": "ip",
  "action": "publish|read|playback|api|metrics|pprof",
  "path": "path",
  "protocol": "rtsp|rtmp|hls|webrtc|srt",
  "id": "id",
  "query": "query",
  "userAgent": "userAgent"
}
```

If the URL returns a status code that begins with `20` (i.e. `200`), authentication is successful, otherwise it fails.

An optional JSON response body can set the expiration time of the authenticated session:

```
{
  "expireAt": "2030-01-01T00:00:00Z"
}
```

`expireAt` must be a future RFC3339 timestamp. When it is reached, the session is closed. An empty response body or an omitted or null `expireAt` leaves the session without an expiration time. Invalid JSON, an invalid timestamp, or an expiration time in the past causes authentication to fail.

Be aware that it’s perfectly normal for the authentication server to receive requests with empty users and passwords, i.e.:

```
{
  "user": "",
  "password": ""
}
```

This happens because RTSP clients don’t provide credentials until they are asked to. In order to receive the credentials, the authentication server must reply with status code `401`, then the client will send credentials.

Some actions can be excluded from the validation process:

```
# Actions to exclude from HTTP-based authentication.
# Format is the same as the one of user permissions.
authHTTPExclude:
  - action: api
  - action: metrics
  - action: pprof
```

If the authentication server uses HTTPS and has a self-signed or invalid TLS certificate, you can provide the fingerprint of the certificate to validate it anyway:

```
authMethod: http
authHTTPAddress: https://myauthserver/auth
authHTTPFingerprint: 33949e05fffb5ff3e8aa16f8213a6251b4d9363804ba53233c4da9a46d6f2739
```

The fingerprint can be obtained with:

```
openssl s_client -connect myauthserver:443 </dev/null 2>/dev/null | sed -n '/BEGIN/,/END/p' > server.crt
openssl x509 -in server.crt -noout -fingerprint -sha256 | cut -d "=" -f2 | tr -d ':'
```

### External JWT provider

Authentication can be delegated to an external identity server, that is capable of generating JWTs and provides a JWKS endpoint. With respect to the HTTP-based method, this has the advantage that the external identity server is contacted once, not for each authentication request, greatly improving performance. In order to use the JWT-based authentication method, set `authMethod` and `authJWTJWKS`:

```
authMethod: jwt
authJWTJWKS: http://my_identity_server/jwks_endpoint
```

Users are expected to pass the encoded JWT as token.

The JWT is expected to contain a `mediamtx_permissions` claim, with a list of permissions in the same format as the one of user permissions:

```
{
  "mediamtx_permissions": [
    {
      "action": "publish",
      "path": ""
    }
  ]
}
```

If the JWKS server uses TLS and has a self-signed or invalid TLS certificate, you can provide the fingerprint of the certificate to validate it anyway:

```
authMethod: jwt
authJWTJWKS: https://my_identity_server/jwks_endpoint
authJWTJWKSFingerprint: 33949e05fffb5ff3e8aa16f8213a6251b4d9363804ba53233c4da9a46d6f2739
```

The fingerprint can be obtained with:

```
openssl s_client -connect my_identity_server:443 </dev/null 2>/dev/null | sed -n '/BEGIN/,/END/p' > server.crt
openssl x509 -in server.crt -noout -fingerprint -sha256 | cut -d "=" -f2 | tr -d ':'
```

Optionally, the JWT `iss` (issuer) and `aud` (audience) claims can be validated by setting `authJWTIssuer` and `authJWTAudience`. When set, tokens that don’t contain the expected values will be rejected:

```
authMethod: jwt
authJWTJWKS: http://my_identity_server/jwks_endpoint
authJWTIssuer: http://my_identity_server
authJWTAudience: mediamtx
```

Leave these fields empty to skip validation of the respective claims.

#### Keycloak setup

Here’s a tutorial on how to setup the [Keycloak identity server](https://www.keycloak.org/) in order to provide JWTs.

1. Start Keycloak:`docker run --name=keycloak -p 8080:8080 \ -e KEYCLOAK_ADMIN=admin -e KEYCLOAK_ADMIN_PASSWORD=admin \ quay.io/keycloak/keycloak:23.0.7 start-dev`
2. Open the Keycloak web UI on [http://localhost:8080](http://localhost:8080), click on *Administration Console* and log in.
3. Click on *master* in the top left corner, *Create realm*, set realm name to `mediamtx`, *Create*.
4. Open page *Client scopes*, *Create client scope*, set name to `mediamtx`, *Save*.
5. Open tab *Mappers*, *Configure a new Mapper*, *User Attribute*:Save.
  - Name: `mediamtx_permissions`
  - User Attribute: `mediamtx_permissions`
  - Token Claim Name: `mediamtx_permissions`
  - Claim JSON Type: `JSON`
  - Multivalued: `On`
6. Open page *Clients*, *Create client*, set Client ID to `mediamtx`, *Next*, *Client authentication* `On`, *Next*, *Save*.
7. Open tab *Credentials*, copy client secret somewhere.
8. Open tab *Client scopes*, set *Assigned type* of all existing client scopes to *Optional*. This decreases the length of the JWT, since many clients have limits on it.
9. In the same tab, click on *Add client scope*, Select `mediamtx`, *Add*, *Default*.
10. Open tab *Advanced*, set *Access token signature algorithm* to `ES256`. *Save*. This further decreases the JWT length.
11. Open page *Users*, *Add user*, pick a username, *Create*, Tab *Credentials*, *Set password*, pick a password, *Save*.
12. Open tab *Attributes*, *Add an attribute*:You can add as many attributes with key `mediamtx_permissions` as you want, each with a single permission in it.
  - Key: `mediamtx_permissions`
  - Value: `{"action":"publish", "path": ""}`
13. In MediaMTX, use the following JWKS URL:`authJWTJWKS: http://localhost:8080/realms/mediamtx/protocol/openid-connect/certs`
14. Perform authentication on Keycloak:`curl \ -d "client_id=mediamtx" \ -d "client_secret=my-client-secret" \ -d "username=my-user" \ -d "password=my-pass" \ -d "grant_type=password" \ http://localhost:8080/realms/mediamtx/protocol/openid-connect/token`This results in:`{  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICIyNzVjX3ptOVlOdHQ0TkhwWVk4Und6ZndUclVGSzRBRmQwY3lsM2wtY3pzIn0.eyJleHAiOjE3MDk1NTUwOTIsImlhdCI6MTcwOTU1NDc5MiwianRpIjoiMzE3ZTQ1NGUtNzczMi00OTM1LWExNzAtOTNhYzQ2ODhhYWIxIiwiaXNzIjoiaHR0cDovL2xvY2FsaG9zdDo4MDgwL3JlYWxtcy9tZWRpYW10eCIsImF1ZCI6ImFjY291bnQiLCJzdWIiOiI2NTBhZDA5Zi03MDgxLTQyNGItODI4Ni0xM2I3YTA3ZDI0MWEiLCJ0eXAiOiJCZWFyZXIiLCJhenAiOiJtZWRpYW10eCIsInNlc3Npb25fc3RhdGUiOiJjYzJkNDhjYy1kMmU5LTQ0YjAtODkzZS0wYTdhNjJiZDI1YmQiLCJhY3IiOiIxIiwiYWxsb3dlZC1vcmlnaW5zIjpbIi8qIl0sInJlYWxtX2FjY2VzcyI6eyJyb2xlcyI6WyJvZmZsaW5lX2FjY2VzcyIsInVtYV9hdXRob3JpemF0aW9uIiwiZGVmYXVsdC1yb2xlcy1tZWRpYW10eCJdfSwicmVzb3VyY2VfYWNjZXNzIjp7ImFjY291bnQiOnsicm9sZXMiOlsibWFuYWdlLWFjY291bnQiLCJtYW5hZ2UtYWNjb3VudC1saW5rcyIsInZpZXctcHJvZmlsZSJdfX0sInNjb3BlIjoibWVkaWFtdHggcHJvZmlsZSBlbWFpbCIsInNpZCI6ImNjMmQ0OGNjLWQyZTktNDRiMC04OTNlLTBhN2E2MmJkMjViZCIsImVtYWlsX3ZlcmlmaWVkIjpmYWxzZSwibWVkaWFtdHhfcGVybWlzc2lvbnMiOlt7ImFjdGlvbiI6InB1Ymxpc2giLCJwYXRocyI6ImFsbCJ9XSwicHJlZmVycmVkX3VzZXJuYW1lIjoidGVzdHVzZXIifQ.Gevz7rf1qHqFg7cqtSfSP31v_NS0VH7MYfwAdra1t6Yt5rTr9vJzqUeGfjYLQWR3fr4XC58DrPOhNnILCpo7jWRdimCnbPmuuCJ0AYM-Aoi3PAsWZNxgmtopq24_JokbFArY9Y1wSGFvF8puU64lt1jyOOyxf2M4cBHCs_EarCKOwuQmEZxSf8Z-QV9nlfkoTUszDCQTiKyeIkLRHL2Iy7Fw7_T3UI7sxJjVIt0c6HCNJhBBazGsYzmcSQ_GrmhbUteMTg00o6FicqkMBe99uZFnx9wIBm_QbO9hbAkkzF923I-DTAQrFLxT08ESMepDwmzFrmnwWYBLE3u8zuUlCA",  "expires_in": 300,  "refresh_expires_in": 1800,  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICI3OTI3Zjg4Zi05YWM4LTRlNmEtYWE1OC1kZmY0MDQzZDRhNGUifQ.eyJleHAiOjE3MDk1NTY1OTIsImlhdCI6MTcwOTU1NDc5MiwianRpIjoiMGVhZWFhMWItYzNhMC00M2YxLWJkZjAtZjI2NTRiODlkOTE3IiwiaXNzIjoiaHR0cDovL2xvY2FsaG9zdDo4MDgwL3JlYWxtcy9tZWRpYW10eCIsImF1ZCI6Imh0dHA6Ly9sb2NhbGhvc3Q6ODA4MC9yZWFsbXMvbWVkaWFtdHgiLCJzdWIiOiI2NTBhZDA5Zi03MDgxLTQyNGItODI4Ni0xM2I3YTA3ZDI0MWEiLCJ0eXAiOiJSZWZyZXNoIiwiYXpwIjoibWVkaWFtdHgiLCJzZXNzaW9uX3N0YXRlIjoiY2MyZDQ4Y2MtZDJlOS00NGIwLTg5M2UtMGE3YTYyYmQyNWJkIiwic2NvcGUiOiJtZWRpYW10eCBwcm9maWxlIGVtYWlsIiwic2lkIjoiY2MyZDQ4Y2MtZDJlOS00NGIwLTg5M2UtMGE3YTYyYmQyNWJkIn0.yuXV8_JU0TQLuosNdp5xlYMjn7eO5Xq-PusdHzE7bsQ",  "token_type": "Bearer",  "not-before-policy": 0,  "session_state": "cc2d48cc-d2e9-44b0-893e-0a7a62bd25bd",  "scope": "mediamtx profile email" }`The JWT is inside the `access_token` key.

## Provide username and password

### RTSP

Prepend username and password and a `@` to the host:

```
rtsp rtsp://myuser:mypass@localhost:8554/mystream
```

### RTMP

Use the `user` and `pass` query parameters:

```
rtmp://localhost/mystream?user=myuser&pass=mypass
```

### SRT

Append username and password to `streamid`:

```
srt://localhost:8890?streamid=publish:mystream:myuser:mypass&pkt_size=1316
```

### HLS and WebRTC

Username and password can be passed through the `Authorization: Basic` HTTP header:

```
Authorization: Basic base64(myuser:mypass)
```

When using a web browser, a dialog is first shown to users, asking for credentials, and then the header is automatically inserted into every request. If you need to automatically fill credentials from a parent web page, read [Embed in a website](https://mediamtx.org/docs/read/web-browsers#embed-in-a-website).

If the `Authorization: Basic` header cannot be used (for instance, in software like OBS Studio, which only allows to provide a “Bearer Token”), credentials can be passed through the `Authorization: Bearer` header (i.e. the “Bearer Token” in OBS), where the value is the concatenation of username and password, separated by a colon:

```
Authorization: Bearer myuser:mypass
```

## Provide tokens / JWTs

### RTSP

Pass the token as a query parameter:

```
rtsp://localhost:8554/mystream?token=mytoken
```

WARNING: FFmpeg implementation of RTSP does not support URLs that are longer than 4096 characters (this is the [MAX_URL_SIZE constant](https://github.com/FFmpeg/FFmpeg/blob/f951aa9ef382d6bb517e05d04d52710f751de427/libavformat/internal.h#L30)), therefore you have to configure your identity server in order to produce JWTs that are shorter than this threshold.

### RTMP

Pass the token as a query parameter:

```
rtmp://localhost/mystream?token=mytoken
```

WARNING: FFmpeg implementation of RTMP does not support URLs that are longer than 1024 characters (this is the [TCURL_MAX_LENGTH constant](https://github.com/FFmpeg/FFmpeg/blob/f951aa9ef382d6bb517e05d04d52710f751de427/libavformat/rtmpproto.c#L55)), therefore you have to configure your identity server in order to produce JWTs that are shorter than this threshold.

### SRT

Pass the token as password, with an arbitrary user:

```
srt://localhost:8890?streamid=publish:mystream:user:mytoken&pkt_size=1316
```

WARNING: SRT does not support Stream IDs that are longer than 512 characters, therefore you have to configure your identity server in order to produce JWTs that are shorter than this threshold.

### HLS and WebRTC

The token can be passed through the `Authorization: Bearer` header:

```
Authorization: Bearer mytoken
```

In OBS Studio, this is the “Bearer Token” field.

If the `Authorization: Bearer` token cannot be directly provided (for instance, with web browsers that directly access *MediaMTX* and show a credential dialog), you can pass the token as password, using an arbitrary user.

In web browsers, if you need to automatically fill credentials from a parent web page, read [Embed in a website](https://mediamtx.org/docs/read/web-browsers#embed-in-a-website).

## Ban after failed attempts

It is possible to prevent certain IPs from connecting to the server after some failed attempts by using `fail2ban` together with *MediaMTX*.

First configure *MediaMTX* to store logs in a file:

```
logDestinations: [stdout, file]
logFile: /var/log/mediamtx.log
```

Install `fail2ban`:

```
sudo apt install -y fail2ban
```

Create the `/etc/fail2ban/filter.d/mediamtx.conf` file with this content:

```
[Definition]

failregex = ^\s*WAR \[[^\]]+\] \[conn <ADDR>:\d+\] failed to authenticate: authentication failed$
            ^\s*INF \[(?P<proto>[^\]]+)\] \[session (?P<sess>[0-9A-Fa-f]+)\] created by <ADDR>:\d+\n\s*WAR \[(?P=proto)\] \[session (?P=sess)\] failed to authenticate: authentication failed\n$

maxlines = 20
datepattern = ^%%Y/%%m/%%d %%H:%%M:%%S
```

Create the `/etc/fail2ban/jail.d/mediamtx.conf` file with this content:

```
[mediamtx]
enabled  = true
filter   = mediamtx
logpath  = /var/log/mediamtx.log
backend  = auto
maxretry = 5
findtime = 600
bantime  = 3600
```

Restart `fail2ban`:

```
sudo systemctl restart fail2ban
```


---

<!-- source: https://mediamtx.org/docs/features/remuxing-reencoding-compression -->

# Re-encoding

To change the format, codec or compression of a stream, use *FFmpeg* or *GStreamer* together with *MediaMTX*. For instance, to re-encode an existing stream, that is available in the `/original` path, and publish the resulting stream in the `/compressed` path, edit `mediamtx.yml` and replace everything inside section `paths` with the following content:

```
paths:
  compressed:
  original:
    runOnAvailable: >
      ffmpeg -i rtsp://localhost:$RTSP_PORT/$MTX_PATH
        -c:v libx264 -pix_fmt yuv420p -preset ultrafast -b:v 600k
        -max_muxing_queue_size 1024 -f rtsp rtsp://localhost:$RTSP_PORT/compressed
    runOnAvailableRestart: yes
```


---

<!-- source: https://mediamtx.org/docs/features/always-available -->

# Always-available

When the publisher or source of a stream is offline, the server can be configured to fill gaps in the stream with an offline segment that is played on repeat until a publisher comes back online. This allows readers to stay connected regardless of the state of the stream. The offline segment and online stream are concatenated without re-encoding any frame, using the original codec.

This feature can be enabled by toggling the `alwaysAvailable` flag and filling `alwaysAvailableTracks`:

```
paths:
  mypath:
    alwaysAvailable: true
    alwaysAvailableTracks:
      # Available values are: AV1, VP9, H265, H264, Opus, MPEG4Audio, G711, LPCM
      - codec: H264
        # in case of MPEG4Audio, G711, LPCM, sampleRate and ChannelCount must be provided too.
        #  sampleRate: 48000
        #  channelCount: 2
        #  in case of G711, muLaw must be provided too.
        #  muLaw: false
```

By default, the server uses a default offline segment with the text “STREAM IS OFFLINE”. The segment can be replaced with an external MP4 file:

```
paths:
  mypath:
    alwaysAvailable: true
    alwaysAvailableFile: "./h264.mp4"
```

By default, the stream is recorded even when no source is connected and the offline segment is playing. To record only when a source is connected, set `alwaysAvailableRecorded` to `false`:

```
paths:
  mypath:
    alwaysAvailable: true
    alwaysAvailableRecorded: false
    record: true
    alwaysAvailableTracks:
      - codec: H264
```


---

<!-- source: https://mediamtx.org/docs/features/record -->

# Record streams

Live streams be recorded to disk and played back with the following file containers and codecs:

| container | codecs |
|---|---|
| fMP4 | **Video**: AV1, VP9, H265, H264, MPEG-4 Video (H263, Xvid), MPEG-1/2 Video, M-JPEG<br>**Audio**: Opus, MPEG-4 Audio (AAC), MPEG-1/2 Audio (MP3), AC-3, G711 (PCMA, PCMU), LPCM |
| MPEG-TS | **Video**: H265, H264, MPEG-4 Video (H263, Xvid), MPEG-1/2 Video<br>**Audio**: Opus, MPEG-4 Audio (AAC), MPEG-1/2 Audio (MP3), AC-3 |

## Usage

To record available streams to disk, set the `record` parameter in the configuration file:

```
pathDefaults:
  # Record streams to disk.
  record: yes
```

It’s also possible to specify additional parameters:

```
pathDefaults:
  # Record streams to disk.
  record: yes
  # Path of recording segments.
  # Extension is added automatically.
  # Available variables are %path (path name), %Y %m %d (year, month, day),
  # %H %M %S (hours, minutes, seconds), %f (microseconds), %z (time zone), %s (unix epoch).
  recordPath: ./recordings/%path/%Y-%m-%d_%H-%M-%S-%f_%z
  # Format of recorded segments.
  # Available formats are "fmp4" (fragmented MP4) and "mpegts" (MPEG-TS).
  recordFormat: fmp4
  # fMP4 segments are concatenation of small MP4 files (parts), each with this duration.
  # MPEG-TS segments are concatenation of 188-bytes packets, flushed to disk with this period.
  # When a system failure occurs, the last part gets lost.
  # Therefore, the part duration is equal to the RPO (recovery point objective).
  recordPartDuration: 1s
  # This prevents RAM exhaustion.
  recordMaxPartSize: 50M
  # Minimum duration of each segment.
  recordSegmentDuration: 1h
  # Delete segments after this timespan.
  # Set to 0s to disable automatic deletion.
  recordDeleteAfter: 1d
```

All available recording parameters are listed in the [configuration file](https://mediamtx.org/docs/references/configuration-file).

## Remote upload

To upload recordings to a remote location, you can use *MediaMTX* together with [rclone](https://github.com/rclone/rclone), a command line tool that provides file synchronization capabilities with a huge variety of services (including S3, FTP, SMB, Google Drive):

1. Download and install [rclone](https://github.com/rclone/rclone).
2. Configure *rclone*:`rclone config`
3. Place `rclone` into the `runOnInit` and `runOnRecordSegmentComplete` hooks:`pathDefaults:  # this is needed to sync segments after a crash.  # replace myconfig with the name of the rclone config.  runOnInit: rclone sync -v ./recordings myconfig:/my-path/recordings   # this is called when a segment has been finalized.  # replace myconfig with the name of the rclone config.  runOnRecordSegmentComplete: rclone sync -v --min-age=1ms ./recordings myconfig:/my-path/recordings`If you want to delete local segments after they are uploaded, replace `rclone sync` with `rclone move`.


---

<!-- source: https://mediamtx.org/docs/features/playback -->

# Playback recorded streams

Existing recordings can be played back to users through a dedicated HTTP server, that can be enabled inside the configuration:

```
playback: yes
playbackAddress: :9996
```

The server provides an endpoint to list recorded timespans:

```
http://localhost:9996/list?path=[mypath]&start=[start]&end=[end]
```

Where:

- [mypath] is the name of a path
- [start] (optional) is the start date in [RFC3339 format](https://www.utctime.net/)
- [end] (optional) is the end date in [RFC3339 format](https://www.utctime.net/)

The server will return a list of timespans in JSON format:

```
[
  {
    "start": "2006-01-02T15:04:05Z07:00",
    "duration": 60.0,
    "url": "http://localhost:9996/get?path=[mypath]&start=2006-01-02T15%3A04%3A05Z07%3A00&duration=60.0"
  },
  {
    "start": "2006-01-02T15:07:05Z07:00",
    "duration": 32.33,
    "url": "http://localhost:9996/get?path=[mypath]&start=2006-01-02T15%3A07%3A05Z07%3A00&duration=32.33"
  }
]
```

The server provides an endpoint to download recordings:

```
http://localhost:9996/get?path=[mypath]&start=[start]&duration=[duration]&format=[format]
```

Where:

- [mypath] is the path name
- [start] is the start date in [RFC3339 format](https://www.utctime.net/)
- [duration] is the maximum duration of the recording in seconds
- [format] (optional) is the output format of the stream. Available values are “fmp4” (default) and “mp4”

All parameters must be [url-encoded](https://www.urlencoder.org/). For instance:

```
http://localhost:9996/get?path=mypath&start=2024-01-14T16%3A33%3A17%2B00%3A00&duration=200.5
```

The resulting stream uses the fMP4 format, that is natively compatible with any browser, therefore its URL can be directly inserted into a <video> tag:

```
<video controls>
  <source
    src="http://localhost:9996/get?path=[mypath]&start=[start_date]&duration=[duration]"
    type="video/mp4"
  />
</video>
```

The fMP4 format may offer limited compatibility with some players. To fix the issue, it’s possible to use the standard MP4 format, by adding `format=mp4` to a `/get` request:

```
http://localhost:9996/get?path=[mypath]&start=[start_date]&duration=[duration]&format=mp4
```


---

<!-- source: https://mediamtx.org/docs/features/forward -->

# Forward streams

Incoming streams can be natively forwarded to other servers with the following protocols:

- Media-over-QUIC
- SRT
- WebRTC
- RTSP
- RTMP

It is also possible to use FFmpeg to perform the forwarding.

We provide instructions to forward streams to the following services:

- YouTube
- Twitch

## Media-over-QUIC

Add the target URL inside `dest` of a `forward` entry:

```
paths:
  mypath:
    forward:
      - dest: moqt://user:pass@host:port/path
        # Transport protocol used to forward the stream. available values are "quic", "webtransport".
        moqTransport: quic
        # If the destination TLS certificate is self-signed or invalid, you can provide the
        # fingerprint of the certificate in order to validate it anyway. It can be obtained by running:
        # openssl s_client -connect dest_ip:dest_port </dev/null 2>/dev/null | sed -n '/BEGIN/,/END/p' > server.crt
        # openssl x509 -in server.crt -noout -fingerprint -sha256 | cut -d "=" -f2 | tr -d ':'
        destFingerprint:
```

## SRT

Add the target URL inside `dest` of a `forward` entry:

```
paths:
  mypath:
    forward:
      - dest: srt://host:port?streamid=streamid
```

## WebRTC

We support forwarding streams by using the WebRTC protocol and the WHIP extension. Add the target URL inside `dest` of a `forward` entry. Use `whip://` for HTTP and `whips://` for HTTPS:

```
paths:
  mypath:
    forward:
      # use whip:// for HTTP and whips:// for HTTPS.
      - dest: whip://host:port/mystream/whip
        # Token to insert in the Authorization: Bearer header.
        whipBearerToken: ""
        # If the destination is HTTPS and the destination TLS certificate is self-signed
        # or invalid, you can provide the fingerprint of the certificate in order to
        # validate it anyway. It can be obtained by running:
        # openssl s_client -connect dest_ip:dest_port </dev/null 2>/dev/null | sed -n '/BEGIN/,/END/p' > server.crt
        # openssl x509 -in server.crt -noout -fingerprint -sha256 | cut -d "=" -f2 | tr -d ':'
        destFingerprint:
```

If the remote server is a *MediaMTX* instance, remember to add a `/whip` suffix after the stream name, since in *MediaMTX* [it’s part of the WHIP URL](https://mediamtx.org/docs/publish/webrtc).

## RTSP

Add the target URL inside `dest` of a `forward` entry:

```
paths:
  mypath:
    forward:
      # Use rtsp:// for plain RTSP and rtsps:// for encrypted RTSP.
      - dest: rtsp://user:pass@host:port/path
        # If the destination is RTSPS and the destination TLS certificate is self-signed
        # or invalid, you can provide the fingerprint of the certificate in order to
        # validate it anyway. It can be obtained by running:
        # openssl s_client -connect dest_ip:dest_port </dev/null 2>/dev/null | sed -n '/BEGIN/,/END/p' > server.crt
        # openssl x509 -in server.crt -noout -fingerprint -sha256 | cut -d "=" -f2 | tr -d ':'
        destFingerprint:
```

## RTMP

Add the target URL inside `dest` of a `forward` entry:

```
paths:
  mypath:
    forward:
      # Use rtmp:// for plain RTMP and rtmps:// for encrypted RTMP.
      - dest: rtmp://user:pass@host:port/path#streamKey
        # If the destination is RTMPS and the destination TLS certificate is self-signed
        # or invalid, you can provide the fingerprint of the certificate in order to
        # validate it anyway. It can be obtained by running:
        # openssl s_client -connect dest_ip:dest_port </dev/null 2>/dev/null | sed -n '/BEGIN/,/END/p' > server.crt
        # openssl x509 -in server.crt -noout -fingerprint -sha256 | cut -d "=" -f2 | tr -d ':'
        destFingerprint:
```

## FFmpeg

When the destination requires transcoding, filtering or a protocol that is not supported by `forward`, use *FFmpeg* inside the `runOnAvailable` parameter instead:

```
pathDefaults:
  runOnAvailable: >
    ffmpeg -i rtsp://localhost:$RTSP_PORT/$MTX_PATH
    -c copy
    -f rtsp rtsp://other-server:8554/another-path
  runOnAvailableRestart: yes
```

## YouTube

Open YouTube, sign in with a valid account, search for the *Create*, *Go Live* button, click it. In the next page, search for *Default stream key*, copy the key somewhere, then search for the *Stream URL* section and copy the URL. Insert the stream URL and the stream key in *MediaMTX* in this way:

```
paths:
  mypath:
    forward:
      # Use an hashtag to separate the URL from the stream key.
      # "a.rtmp.youtube.com/live2" was the URL YouTube was reporting last time this documentation was updated. Check that it is still correct.
      # Also replace rtmp:// with rtmps:// and rtmp with rtmps in the URI in order to enable encryption in-transit.
      - dest: rtmps://a.rtmps.youtube.com/live2#streamKey
```

**Warning**: YouTube requires streams to have both a video and an audio track. Video-only streams are silently rejected.

## Twitch

Open Twitch, sign in with a valid account, go to *Settings*, *Stream*. Search for the *Primary Stream Key*, copy it somewhere. Then search for *Recommended Ingest Endpoints*, that should be in [this page](https://help.twitch.tv/s/twitch-ingest-recommendation?language=en_US). Copy one of the URLs. Insert the URL and the stream key in *MediaMTX* in this way:

```
paths:
  mypath:
    forward:
      # Use an hashtag to separate the URL from the stream key.
      # "rtmp://ingest.global-contribute.live-video.net/app" was the URL Twitch was reporting last time this documentation was updated. Check that it is still correct.
      # Also replace rtmp:// with rtmps:// in order to enable encryption in-transit.
      - dest: rtmps://ingest.global-contribute.live-video.net/app#streamKey
```


---

<!-- source: https://mediamtx.org/docs/features/proxy -->

# Proxy requests

The server allows to proxy incoming requests to other servers or cameras. This is useful to expose servers or cameras behind a NAT. Edit `mediamtx.yml` and replace everything inside section `paths` with the following content:

```
paths:
  "~^(.+)$":
    # If path name is a regular expression, $G1, $G2, etc will be replaced
    # with regular expression groups.
    source: rtsp://other-server:8554/$G1
    sourceOnDemand: yes
```

All requests addressed to `rtsp://mediamtx:8554/a` will be forwarded to `rtsp://other-server:8554/a` and so on.


---

<!-- source: https://mediamtx.org/docs/features/extract-snapshots -->

# Extract snapshots

You can periodically extract snapshots from available streams by using FFmpeg inside the `runOnAvailable` hook:

```
pathDefaults:
  runOnAvailable: |
    bash -c "
    while true; do
      mkdir -p $(dirname snapshots/$MTX_PATH)
      ffmpeg -i rtsp://localhost:8554/$MTX_PATH -frames:v 1 -update true -y snapshots/$MTX_PATH.jpg
      sleep 10
    done"
```

Where `10` is the interval between snapshots.


---

<!-- source: https://mediamtx.org/docs/features/on-demand-publishing -->

# On-demand publishing

Edit `mediamtx.yml` and replace everything inside section `paths` with the following content:

```
paths:
  ondemand:
    runOnDemand: ffmpeg -re -stream_loop -1 -i file.mp4 -c copy -f rtsp rtsp://localhost:$RTSP_PORT/$MTX_PATH
    runOnDemandRestart: yes
```

The command inserted into `runOnDemand` will start only when a client requests the path `ondemand`, therefore the file will start streaming only when requested.


---

<!-- source: https://mediamtx.org/docs/features/absolute-timestamps -->

# Route absolute timestamps

Some streaming protocols allow to route absolute timestamps, associated with each frame, that are useful for synchronizing several video or data streams together. In particular, *MediaMTX* supports receiving absolute timestamps with the following protocols and devices:

- HLS
- RTSP
- WebRTC
- Raspberry Pi Camera

and supports sending absolute timestamps with the following protocols:

- HLS
- RTSP
- WebRTC

By default, absolute timestamps of incoming frames are not used, instead they are replaced with the system timestamp. This prevents users from arbitrarily changing recording dates, and also allows to support sources that do not send absolute timestamps. It is possible to preserve original absolute timestamps by toggling the `useAbsoluteTimestamp` parameter:

```
pathDefaults:
  # Use absolute timestamp of frames, instead of replacing them with the current time.
  useAbsoluteTimestamp: false
```

## Absolute timestamp in HLS

In the HLS protocol, absolute timestamps are routed by adding a `EXT-X-PROGRAM-DATE-TIME` tag before each segment:

```
#EXTM3U
#EXT-X-VERSION:9
#EXT-X-MEDIA-SEQUENCE:20
#EXT-X-TARGETDURATION:2
#EXT-X-PROGRAM-DATE-TIME:2015-02-05T01:02:00Z
#EXTINF:2,
segment1.mp4
#EXT-X-PROGRAM-DATE-TIME:2015-02-05T01:04:00Z
#EXTINF:2,
segment2.mp4
```

The `EXT-X-PROGRAM-DATE-TIME` value is the absolute timestamp that corresponds to the first frame of the segment. The absolute timestamp of following frames can be obtained by summing `EXT-X-PROGRAM-DATE-TIME` with the relative frame timestamp.

A library that can read absolute timestamps with HLS is [gohlslib](https://github.com/bluenviron/gohlslib).

## Absolute timestamp in RTSP and WebRTC

In RTSP and WebRTC, absolute timestamps are routed through periodic RTCP sender reports:

```
        0                   1                   2                   3
        0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
       +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
header |V=2|P|    RC   |   PT=SR=200   |             length            |
       +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
       |                         SSRC of sender                        |
       +=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+
sender |              NTP timestamp, most significant word             |
info   +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
       |             NTP timestamp, least significant word             |
       +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
       |                         RTP timestamp                         |
...
```

The sender report contains a reference absolute timestamp (NTP timestamp) and a reference relative timestamp (RTP timestamp). The absolute timestamp of each frame can be computed by using these values together with the RTP timestamp of the frame (shipped with each frame), through the formula:

```
frame_abs_timestamp = ref_ntp_timestamp + (frame_rtp_timestamp - ref_rtp_timestamp) / clock_rate
```

A library that can read absolute timestamps with RTSP is [gortsplib](https://github.com/bluenviron/gortsplib).

A browser can read absolute timestamps with WebRTC if it exposes the [estimatedPlayoutTimestamp](https://www.w3.org/TR/webrtc-stats/#dom-rtcinboundrtpstreamstats-estimatedplayouttimestamp) statistic.


---

<!-- source: https://mediamtx.org/docs/features/expose-the-server-in-a-subfolder -->

# Expose the server in a subfolder

HTTP-based services (Media-over-QUIC, WebRTC, HLS, Control API, Playback Server, Metrics, pprof) can be exposed in a subfolder of an external HTTP server or reverse proxy. The reverse proxy must be able to intercept HTTP requests addressed to *MediaMTX* and corresponding responses, and must perform the following changes:

- The subfolder path must be stripped from request paths. For instance, if the server is exposed behind `/subpath` and the reverse proxy receives a request with path `/subpath/mystream/index.m3u8`, this has to be changed into `/mystream/index.m3u8`.
- Any `Location` header in responses must be prefixed with the subfolder path. For instance, if the server is exposed behind `/subpath` and the server sends a response with `Location: /mystream/index.m3u8`, this has to be changed into `Location: /subfolder/mystream/index.m3u8`.

## Nginx

When *Nginx* is the reverse proxy, rules described above can be implemented with the following configuration:

```
location /subpath/ {
    proxy_pass http://mediamtx-ip:8889/;
    proxy_redirect / /subpath/;
}
```

## Apache HTTP Server

When *Apache HTTP Server* is the reverse proxy, rules described above can be implemented with the following configuration:

```
<Location /subpath>
    ProxyPass http://mediamtx-ip:8889
    ProxyPassReverse http://mediamtx-ip:8889
    Header edit Location ^(.*)$ "/subpath$1"
</Location>
```

## Caddy

When *Caddy* is the reverse proxy, rules described above can be implemented with the following configuration:

```
:80 {
    handle_path /subpath/* {
        reverse_proxy {
            to mediamtx-ip:8889
            header_down Location ^/ /subpath/
        }
    }
}
```


---

<!-- source: https://mediamtx.org/docs/features/start-on-boot -->

# Start on boot

## Linux

On most Linux distributions (including Ubuntu and Debian, but not OpenWrt), *systemd* is in charge of managing services and starting them on boot.

Move the server executable and configuration in global folders:

```
sudo mkdir -p /usr/local/bin
sudo mv mediamtx /usr/local/bin/
sudo mkdir -p /usr/local/etc/mediamtx
sudo mv mediamtx.yml /usr/local/etc/mediamtx/
```

Create a *systemd* service:

```
sudo tee /etc/systemd/system/mediamtx.service >/dev/null << EOF
[Unit]
After=network-online.target
Wants=network-online.target
[Service]
WorkingDirectory=/usr/local/etc/mediamtx
ExecStart=/usr/local/bin/mediamtx
[Install]
WantedBy=multi-user.target
EOF
```

Enable a *wait-online* service to make sure that *MediaMTX* is started after network has been properly initialized:

```
sudo systemctl enable systemd-networkd-wait-online.service
```

If SELinux is enabled (for instance in case of RedHat, Rocky, CentOS++), add correct security context:

```
semanage fcontext -a -t bin_t /usr/local/bin/mediamtx
restorecon -Fv /usr/local/bin/mediamtx
```

Enable and start the service:

```
sudo systemctl daemon-reload
sudo systemctl enable mediamtx
sudo systemctl start mediamtx
```

## OpenWrt

Move the server executable and configuration in global folders:

```
mkdir -p /usr/local/bin
mv mediamtx /usr/local/bin/
mkdir -p /usr/local/etc/mediamtx
mv mediamtx.yml /usr/local/etc/mediamtx/
```

Create a procd service:

```
tee /etc/init.d/mediamtx >/dev/null << EOF
#!/bin/sh /etc/rc.common
USE_PROCD=1
START=95
STOP=01
start_service() {
    procd_open_instance
    procd_set_param command /bin/sh -c 'cd /usr/local/etc/mediamtx && exec /usr/local/bin/mediamtx'
    procd_set_param stdout 1
    procd_set_param stderr 1
    procd_close_instance
}
EOF
```

Enable and start the service:

```
chmod +x /etc/init.d/mediamtx
/etc/init.d/mediamtx enable
/etc/init.d/mediamtx start
```

Read the server logs:

```
logread
```

## Windows

Download the [WinSW v2 executable](https://github.com/winsw/winsw/releases) and place it into the same folder of `mediamtx.exe`.

In the same folder, create a file named `WinSW-x64.xml` with this content:

```
<service>
  <id>mediamtx</id>
  <name>mediamtx</name>
  <description></description>
  <executable>%BASE%/mediamtx.exe</executable>
</service>
```

Open a terminal, navigate to the folder and run:

```
WinSW-x64 install
```

The server is now installed as a system service and will start at boot time.


---

<!-- source: https://mediamtx.org/docs/features/logging -->

# Logging

## Log verbosity

Log verbosity can be set with the `logLevel` parameter:

```
# Verbosity of the program; available values are "error", "warn", "info", "debug".
logLevel: info
```

## Log destinations

Log entries can be sent to multiple destinations. By default, they are printed on the console (stdout).

It is possible to write logs to a file by using these parameters:

```
# Destinations of log messages; available values are "stdout", "file" and "syslog".
logDestinations: [file]
# If "file" is in logDestinations, this is the file which will receive the logs.
logFile: mediamtx.log
```

It is possible to write logs to the system logging server (syslog) by using these parameters:

```
# Destinations of log messages; available values are "stdout", "file" and "syslog".
logDestinations: [syslog]
# If "syslog" is in logDestinations, use prefix for logs.
sysLogPrefix: mediamtx
```

Log entries can be queried by using:

```
journalctl SYSLOG_IDENTIFIER=mediamtx
```

If *MediaMTX* is also running as a [system service](https://mediamtx.org/docs/features/start-on-boot), log entries can be queried by using:

```
journalctl -u mediamtx
```

## Structured logging

Log collectors (like Loki, Logstash, CloudWatch and fluentd) parse logs in a more reliable way if they are fed with entries in structured format (JSONL). This can be enabled with the `logStructured` parameter:

```
# When destination is "stdout" or "file", emit logs in structured format (JSONL).
logStructured: true
```

Obtaining:

```
{"timestamp":"20XX-YY-ZZT10:45:05.999999999+01:00","level":"INF","message":"[RTSP] listener opened on :8554 (TCP/RTSP), :8000 (UDP/RTP), :8001 (UDP/RTCP)"}
{"timestamp":"20XX-YY-ZZT10:45:05.999999999+01:00","level":"INF","message":"[RTMP] listener opened on :1935"}
{"timestamp":"20XX-YY-ZZT10:45:05.999999999+01:00","level":"INF","message":"[HLS] listener opened on :8888"}
{"timestamp":"20XX-YY-ZZT10:45:05.999999999+01:00","level":"INF","message":"[WebRTC] listener opened on :8889 (TCP/HTTP), :8189 (UDP/ICE)"}
{"timestamp":"20XX-YY-ZZT10:45:05.999999999+01:00","level":"INF","message":"[SRT] listener opened on :8890 (UDP)"}
```

## Log file rotation

The log file can be periodically rotated or truncated by using an external utility.

On most Linux distributions, the `logrotate` utility is in charge of managing log files. It can be configured to handle the *MediaMTX* log file too by creating a configuration file, placed in `/etc/logrotate.d/mediamtx`, with this content:

```
/my/mediamtx/path/mediamtx.log {
    daily
    copytruncate
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
}
```

This file will rotate the log file every day, adding a `.NUMBER` suffix to older copies:

```
mediamtx.log.1
mediamtx.log.2
mediamtx.log.3
...
```


---

<!-- source: https://mediamtx.org/docs/features/scalability -->

# Scalability

When handling large amounts of readers or publishers, streaming performance might get degraded due to bottlenecks in the underlying hardware infrastructure. In case of streaming without re-encoding (which is what MediaMTX does), these bottlenecks are almost always related to the limited bandwidth between server and readers. This issue can be strongly mitigated by implementing horizontal scalability, which means deploying multiple coordinated server instances, and evenly distributing load on them.

There are several methods available to implement horizontal scalability, the main ones are described in this page.

## Read replicas

The main technique for handling additional readers consists in instantiating additional MediaMTX instances, called read replicas, that are in charge of picking streams from a MediaMTX “origin” instance and serving them to users. User connections and requests are distributed to each replica by a load balancer.

![read replicas](/assets/read-replicas.B32Uouxl_zRxq8.svg)

Publishers are meant to publish to the origin instance.

Read replicas must be configured in this way:

- Add one or more proxy paths, pointing to the MediaMTX origin instance, as described in [Proxy](https://mediamtx.org/docs/features/proxy).
- If the protocol used by readers is WebRTC, disable `webrtcLocalUDPAddress` and `webrtcLocalTCPAddress` and enable a STUN server, as described in [Solving WebRTC connectivity issues](https://mediamtx.org/docs/features/webrtc-specific-features#solving-webrtc-connectivity-issues).

The load balancer has to behave differently depending on the protocol(s) readers are gonna use to read the stream:

- When using RTSP, RTMP, SRT, the load balancer must be a Layer 4 LB.
- When using HLS and WebRTC, the load balancer must be a Layer 7 LB with sticky sessions enabled. Sticky sessions are needed to forward HTTP requests from the same user to the same replica, since a single HLS or WebRTC session is composed of several HTTP requests.

### Generic implementation

1. On the machine meant to host the MediaMTX origin instance, launch the instance:`docker run -d \ --name mediamtx \ --restart always \ --network host \ bluenviron/mediamtx:1`
2. On machines meant to host read replicas, create this MediaMTX configuration (`mediamtx.yml`):`webrtcLocalUDPAddress: webrtcICEServers2:  - url: stun:stun.l.google.com:19302  paths:  "~^(.+)$":  source: rtsp://dns-of-origin:8554/$G1  sourceOnDemand: yes`Replace `dns-of-origin` with the DNS or IP of the origin machine.Then launch MediaMTX:`docker run -d \ --name mediamtx \ --restart always \ --network host \ -v $PWD/mediamtx.yml:/mediamtx.yml \ bluenviron/mediamtx:1`
3. On machines meant to host the load balancer, create this [Traefik](https://traefik.io/) configuration (`traefik.yml`):`entryPoints:  rtsp:  address: ":8554"  rtmp:  address: ":1935"  srt:  address: ":8890/udp" # SRT usually uses UDP  hls:  address: ":8888"  webrtc:  address: ":8889"  providers:  file:  filename: "/etc/traefik/dynamic_conf.yml"  watch: true`Create this second, dynamic, configuration (`dynamic_conf.yml`):`tcp:  routers:  rtsp-router:  rule: "HostSNI(`*`)"  entryPoints: ["rtsp"]  service: "rtsp-service"  rtmp-router:  rule: "HostSNI(`*`)"  entryPoints: ["rtmp"]  service: "rtmp-service"   services:  rtsp-service:  loadBalancer:  servers:  - address: "replica-1-ip:8554"  - address: "replica-2-ip:8554"  rtmp-service:  loadBalancer:  servers:  - address: "replica-1-ip:1935"  - address: "replica-2-ip:1935"  udp:  routers:  srt-router:  entryPoints: ["srt"]  service: "srt-service"  services:  srt-service:  loadBalancer:  servers:  - address: "replica-1-ip:8890"  - address: "replica-2-ip:8890"  http:  routers:  hls-router:  rule: "PathPrefix(`/`)"  entryPoints: ["hls"]  service: "hls-service"  webrtc-router:  rule: "PathPrefix(`/`)"  entryPoints: ["webrtc"]  service: "webrtc-service"   services:  hls-service:  loadBalancer:  sticky:  cookie:  name: "SERVERID"  servers:  - url: "http://replica-1-ip:8888"  - url: "http://replica-2-ip:8888"  webrtc-service:  loadBalancer:  sticky:  cookie:  name: "SERVERID"  servers:  - url: "http://replica-1-ip:8889"  - url: "http://replica-2-ip:8889"`Then launch Traefik:`docker run -d \ --name traefik \ --restart always \ --network host \ -v $PWD/traefik.yml:/etc/traefik/traefik.yml \ -v $PWD/dynamic_conf.yml:/etc/traefik/dynamic_conf.yml \ traefik:v3.6.14`

You can now use the IP address or DNS of the load balancer machines to read streams with any protocol.

It is also possible to entirely skip the load balancer setup by creating a domain name associated with all read replica IPs, and using that to read streams, although it is up to the DNS provider to randomize the IP order and it is up to clients to pick a random one.

### AWS implementation

1. Create a *Security group* called `mediamtx-load-balancer`, that will be used by the load balancers. In *Inbound rules*, add:
  - a rule with type *All TCP*, source `0.0.0.0/0` (anywhere).
  - a rule with type *All UDP*, source `0.0.0.0/0` (anywhere).
2. Create a *Security group* called `mediamtx-read-replicas`, that will be used by the read replicas. In *Inbound rules*, add:
  - a rule of type *SSH*. In the *source* field, insert the IP range of administrators.
  - a rule with type *All TCP*, source *Custom*, pick the `mediamtx-load-balancer` security group.
  - a rule with type *All UDP*, source *Custom*, pick the `mediamtx-load-balancer` security group.
3. Create a *Security group* called `mediamtx-origin`, that will be used by the origin. In *Inbound rules*, add:
  - a rule of type *SSH*. In the *source* field, insert the IP range of administrators.
  - a rule with type *Custom TCP*, port `8554` (RTSP), source *Custom*, pick the `mediamtx-read-replicas` security group.
  - a rule with type *All UDP*, source *Custom*, pick the `mediamtx-read-replicas` security group.
  - a rule of type *Custom TCP*, port `8554` (RTSP). In the *source* field, insert the IP range of publishers.
  - a rule of type *All UDP*. In the *Source* field, insert the IP range of publishers.
4. Launch an EC2 instance that is meant to host the MediaMTX origin instance. Pick the *Amazon Linux* AMI. Assign the `mediamtx-origin` *Security group* to the instance. In *Advanced Details*, in the *User data* textarea, copy and paste this:`#!/bin/bash dnf update -y dnf install -y docker systemctl start docker systemctl enable docker usermod -aG docker ec2-user  docker run -d \ --name mediamtx \ --restart always \ --network host \ bluenviron/mediamtx:1`
5. Create a *Launch template* for the read replicas. Pick the *Amazon Linux* AMI. Assign the `mediamtx-read-replicas` *Security group* to the launch template. In *Advanced Details*, in the *User data* textarea, copy and paste this:`#!/bin/bash dnf update -y dnf install -y docker systemctl start docker systemctl enable docker usermod -aG docker ec2-user  mkdir -p /etc/mediamtx/ tee /etc/mediamtx/mediamtx.yml << EOF webrtcLocalUDPAddress: webrtcICEServers2:  - url: stun:stun.l.google.com:19302  paths:  "~^(.+)$":  source: rtsp://dns-of-origin:8554/\$G1  sourceOnDemand: yes EOF  docker run -d \ --name mediamtx \ --restart always \ --network host \ -v /etc/mediamtx/mediamtx.yml:/mediamtx.yml \ bluenviron/mediamtx:1`Replace `dns-of-origin` with the private DNS of the origin EC2 instance.
6. Create several *Target groups*, with target type *Instances*, one for each of the following Protocol / Port combinations:Do not associate these target groups with any instance for now.
  - Name `mediamtx-read-replicas-8554`, Protocol *TCP*, port `8554` (RTSP), health check protocol *TCP*.
  - Name `mediamtx-read-replicas-1935`, Protocol *TCP*, port `1935` (RTMP), health check protocol *TCP*.
  - Name `mediamtx-read-replicas-8890`, Protocol *UDP*, port `8890` (SRT), health check protocol *TCP*, Advanced health check settings, Health check port, override, insert `8554`.
  - Name `mediamtx-read-replicas-8888`, Protocol *HTTP*, port `8888` (HLS), health check protocol *HTTP*, Advanced health check settings, Health check success codes `404`.
  - Name `mediamtx-read-replicas-8889`, Protocol *HTTP*, port `8889` (WebRTC), health check protocol *HTTP*, Advanced health check settings, Health check success codes `404`.
7. Select the `mediamtx-read-replicas-8888` target group, tab *Attributes*, *Edit*, section *Target selection configuration*, *Turn on stickiness*, *Save*. Do the same for the `mediamtx-read-replicas-8889` target group.
8. Create a *Load Balancer*, type *Network Load Balancer*. Assign the `mediamtx-load-balancer` *Security group* to the load balancer. In *Listeners*, define 3 listeners:
  - Protocol *TCP*, port `8554` (RTSP), forward to target group `mediamtx-read-replicas-8554`
  - Protocol *TCP*, port `1935` (RTMP), forward to target group `mediamtx-read-replicas-1935`
  - Protocol *UDP*, port `8890` (SRT), forward to target group `mediamtx-read-replicas-8890`
9. Create a *Load Balancer*, type *Application Load Balancer*. Assign the `mediamtx-load-balancer` *Security group* to the load balancer. In *Listeners*, define 2 listeners:
  - Protocol *HTTP*, port `8888` (HLS), forward to target group `mediamtx-read-replicas-8888`
  - Protocol *HTTP*, port `8889` (WebRTC), forward to target group `mediamtx-read-replicas-8889`
10. Create an *Auto scaling group* for the read replicas. Pick the launch template that was defined before. CPU and Memory parameters are usually not important. In the *Load balancing* section, pick *Attach to an existing load balancer* and select all 5 target groups that were created before. In the *Group size* section, in *Desired capacity*, set the desired instance count.

You can now use the DNS of the *Network Load Balancer* to read streams with RTSP, RTMP and SRT, and the DNS of the *Application Load Balancer* to read streams with HLS and WebRTC.

This process involved all available protocols, but it can be greatly simplified if users are meant to read streams with a single protocol only (for instance, WebRTC), in this case, opening specific ports only (8889) and creating specific load balancers only (Application load balancer) is enough.

## CDN

The read replicas technique provides the lowest latency, is compatible with all protocols and can be implemented on any on-premises or cloud environment, but it comes with some limitations regarding performance and cost:

- Sudden load spikes can be handled by adjusting read replica count, but this adjustement is not immediate and depends on either an autoscaling policy or a manual action, leading to a potential temporary performance degradation.
- Increasing the read replica count can lead to saturation of the bandwidth between read replicas and the origin, creating a new bottleneck.
- Each read replica requires a dedicated and potentially expensive machine.

An alternative way to serve streams consists in putting a CDN in front of the MediaMTX HLS server, in charge of storing cacheable files and serving requests, freeing the server from the load of most user requests. This method overcomes scalability and cost limitations, but has some drawbacks:

- Only the HLS protocol is available.
- Low-Latency HLS playlists cannot be cached and are always requested from the server, therefore it is often necessary to disable the Low-Latency HLS variant, introducing significant latency.
- Standard MediaMTX authentication mechanisms are not available. Streams are always accessible by anyone, unless the CDN enforces its own authentication system.

In order to allow MediaMTX to recognize CDN requests and serve cacheable files, the CDN must insert into every request an `Authorization: Bearer` header with a secret, that must match the one defined in the `hlsCDNSecret` configuration parameter in MediaMTX.

### Generic implementation

1. On the machine meant to host MediaMTX, create this MediaMTX configuration (`mediamtx.yml`):`hlsCDNSecret: XXXXXXXXXX hlsVariant: fmp4 paths:  all:`Replace `hlsCDNSecret` with some secret key. Using the `fmp4` HLS variant is strongly encouraged to prevent playlist requests from always reaching the server.Then launch MediaMTX:`docker run -d \ --name mediamtx \ --restart always \ --network host \ bluenviron/mediamtx:1`
2. Configure the CDN to use the MediaMTX machine as origin, and to inject `hlsCDNSecret` in the `Authorization: Bearer` header.

### AWS implementation

1. Create a *Security group* called `mediamtx-load-balancer`, that will be used by the load balancer in front of the origin. In *Inbound rules*, add:
  - a rule with type *All TCP*, source `0.0.0.0/0` (anywhere).
2. Create a *Security group* called `mediamtx-origin`, that will be used by the EC2 instance that will host MediaMTX. In *Inbound rules*, add:
  - a rule of type *SSH*. In the *source* field, insert the IP range of administrators.
  - a rule of type *Custom TCP*, port `8554` (RTSP). In the *source* field, insert the IP range of publishers.
  - a rule of type *All UDP*. In the *Source* field, insert the IP range of publishers.
  - a rule with type *All TCP*, source *Custom*, pick the `mediamtx-load-balancer` security group.
3. Create an *EC2 instance*. Assign the `mediamtx-origin` *Security group* to the instance.
4. Log into the EC2 instance. create this MediaMTX configuration (`mediamtx.yml`):`hlsCDNSecret: XXXXXXXXXX hlsVariant: fmp4 paths:  all:`Replace `hlsCDNSecret` with some secret key. Using the `fmp4` HLS variant is strongly encouraged to prevent playlist requests from always reaching the server.Then launch MediaMTX:`sudo dnf update -y sudo dnf install -y docker sudo systemctl start docker sudo systemctl enable docker sudo usermod -aG docker ec2-user sudo docker run \ -d \ --restart=always \ --name mediamtx \ --network host \ -v $PWD/mediamtx.yml:/mediamtx.yml \ bluenviron/mediamtx:1`
5. Create a *Target group*. In *Target Type* leave *Instance*, in *Protocol* leave *HTTP*, in *Port* insert `8888` (HLS). Open *Advanced health check settings*, in *Success codes* insert `404`. Associate the *Target group* with the EC2 instance.
6. Create a *Load Balancer*, type *Application Load Balancer*. Assign the `mediamtx-load-balancer` *Security group* to the load balancer. In *Listeners*, set the HTTP port to `8888` (HLS) and in *Target group* select the target group that was created previously.
7. Create a *CloudFront* distribution. Point it to the load balancer. In *HTTP port*, insert `8888` (HLS).In the distribution page, edit the origin. Under *Add custom header*, click on *Add header* and fill:In the distribution page, edit the default behavior. In *Cache policy*, pick `UseOriginCacheControlHeaders`.
  - Header name: `Authorization`
  - Value: `Bearer XXXXX` (replace XXXX with the `hlsCDNSecret` value)

You can now use the URL of the *CloudFront* distribution to read HLS streams, for instance:

```
https://xxxxxx.cloudfront.net/stream/
```

Replace `xxxxxx.cloudfront.net` with the distribution domain, and `stream` with the stream path.


---

<!-- source: https://mediamtx.org/docs/features/hooks -->

# Hooks

The server allows to specify commands that are executed when a certain event happens, allowing the propagation of events to external software.

## runOnConnect

`runOnConnect` runs a command when a client connects to the server:

```
# Command to run when a client connects to the server.
# This is terminated with SIGINT when a client disconnects from the server.
# The following environment variables are available:
# * MTX_CONN_TYPE: connection type
# * MTX_CONN_ID: connection ID
# * RTSP_PORT: RTSP server port
runOnConnect: curl http://my-custom-server/webhook?conn_type=$MTX_CONN_TYPE&conn_id=$MTX_CONN_ID
# Restart the command if it exits.
runOnConnectRestart: no
```

## runOnDisconnect

`runOnDisconnect` runs a command when a client disconnects from the server:

```
# Command to run when a client disconnects from the server.
# Environment variables are the same as runOnConnect.
runOnDisconnect: curl http://my-custom-server/webhook?conn_type=$MTX_CONN_TYPE&conn_id=$MTX_CONN_ID
```

## runOnInit

`runOnInit` runs a command when a path is initialized. This can be used to publish a stream when the server is launched:

```
paths:
  mypath:
    # Command to run when this path is initialized.
    # This can be used to publish a stream when the server is launched.
    # This is terminated with SIGINT when the program closes.
    # The following environment variables are available:
    # * MTX_PATH: path name
    # * RTSP_PORT: RTSP server port
    # * G1, G2, ...: regular expression groups, if path name is
    #   a regular expression.
    runOnInit: ffmpeg -i my_file.mp4 -c copy -f rtsp rtsp://localhost:8554/mypath
    # Restart the command if it exits.
    runOnInitRestart: no
```

## runOnDemand

`runOnDemand` runs a command when a path is requested by a reader. This can be used to publish a stream on demand:

```
pathDefaults:
  # Command to run when this path is requested by a reader
  # and no one is publishing to this path yet.
  # This can be used to publish a stream on demand.
  # This is terminated with SIGINT when there are no readers anymore.
  # The following environment variables are available:
  # * MTX_PATH: path name
  # * MTX_QUERY: query parameters (passed by first reader) (url-encoded)
  # * RTSP_PORT: RTSP server port
  # * G1, G2, ...: regular expression groups, if path name is
  #   a regular expression.
  runOnDemand: ffmpeg -i my_file.mp4 -c copy -f rtsp rtsp://localhost:8554/mypath
  # Restart the command if it exits.
  runOnDemandRestart: no
```

## runOnUnDemand

`runOnUnDemand` runs a command when there are no readers anymore:

```
pathDefaults:
  # Command to run when there are no readers anymore.
  # Environment variables are the same as runOnDemand.
  runOnUnDemand:
```

## runOnAvailable

`runOnAvailable` runs a command when a stream is available to be read:

```
pathDefaults:
  # Command to run when the stream is available to be read.
  # This is terminated with SIGINT when the stream is not available anymore.
  # The following environment variables are available:
  # * MTX_PATH: path name
  # * MTX_QUERY: query parameters (passed by publisher) (url-encoded)
  # * MTX_SOURCE_TYPE: source type
  # * MTX_SOURCE_ID: source ID
  # * RTSP_PORT: RTSP server port
  # * G1, G2, ...: regular expression groups, if path name is
  #   a regular expression.
  runOnAvailable: curl http://my-custom-server/webhook?path=$MTX_PATH&source_type=$MTX_SOURCE_TYPE&source_id=$MTX_SOURCE_ID
  # Restart the command if it exits.
  runOnAvailableRestart: no
```

## runOnUnavailable

`runOnUnavailable` runs a command when a stream is no longer available:

```
pathDefaults:
  # Command to run when the stream is not available anymore.
  # Environment variables are the same as runOnAvailable.
  runOnUnavailable: curl http://my-custom-server/webhook?path=$MTX_PATH&source_type=$MTX_SOURCE_TYPE&source_id=$MTX_SOURCE_ID
```

## runOnOnline

`runOnOnline` runs a command when a stream is online, which means that the stream is available and provided by an online source (not an offline segment):

```
pathDefaults:
  # Command to run when the stream is online, which means
  # that the stream is available and provided by a online source (not an offline segment).
  # This is terminated with SIGINT when the stream is not online anymore.
  # The following environment variables are available:
  # * MTX_PATH: path name
  # * MTX_QUERY: query parameters (passed by publisher) (url-encoded)
  # * MTX_SOURCE_TYPE: source type
  # * MTX_SOURCE_ID: source ID
  # * RTSP_PORT: RTSP server port
  # * G1, G2, ...: regular expression groups, if path name is
  #   a regular expression.
  runOnOnline: curl http://my-custom-server/webhook?path=$MTX_PATH&source_type=$MTX_SOURCE_TYPE&source_id=$MTX_SOURCE_ID
  # Restart the command if it exits.
  runOnOnlineRestart: no
```

## runOnOffline

`runOnOffline` runs a command when a stream is no longer online:

```
pathDefaults:
  # Command to run when the stream is not online anymore.
  # Environment variables are the same as runOnOnline.
  runOnOffline: curl http://my-custom-server/webhook?path=$MTX_PATH&source_type=$MTX_SOURCE_TYPE&source_id=$MTX_SOURCE_ID
```

## runOnRead

`runOnRead` runs a command when a client starts reading:

```
pathDefaults:
  # Command to run when a client starts reading.
  # This is terminated with SIGINT when a client stops reading.
  # The following environment variables are available:
  # * MTX_PATH: path name
  # * MTX_QUERY: query parameters (passed by reader) (url-encoded)
  # * MTX_READER_TYPE: reader type
  # * MTX_READER_ID: reader ID
  # * RTSP_PORT: RTSP server port
  # * G1, G2, ...: regular expression groups, if path name is
  #   a regular expression.
  runOnRead: curl http://my-custom-server/webhook?path=$MTX_PATH&reader_type=$MTX_READER_TYPE&reader_id=$MTX_READER_ID
  # Restart the command if it exits.
  runOnReadRestart: no
```

## runOnUnread

`runOnUnread` runs a command when a client stops reading:

```
pathDefaults:
  # Command to run when a client stops reading.
  # Environment variables are the same as runOnRead.
  runOnUnread: curl http://my-custom-server/webhook?path=$MTX_PATH&reader_type=$MTX_READER_TYPE&reader_id=$MTX_READER_ID
```

## runOnRecordSegmentCreate

`runOnRecordSegmentCreate` runs a command when a recording segment is created:

```
pathDefaults:
  # Command to run when a recording segment is created.
  # The following environment variables are available:
  # * MTX_PATH: path name
  # * MTX_SEGMENT_PATH: segment file path
  # * RTSP_PORT: RTSP server port
  # * G1, G2, ...: regular expression groups, if path name is
  #   a regular expression.
  runOnRecordSegmentCreate: curl http://my-custom-server/webhook?path=$MTX_PATH&segment_path=$MTX_SEGMENT_PATH
```

## runOnRecordSegmentComplete

`runOnRecordSegmentComplete` runs a command when a recording segment is complete:

```
pathDefaults:
  # Command to run when a recording segment is complete.
  # The following environment variables are available:
  # * MTX_PATH: path name
  # * MTX_SEGMENT_PATH: segment file path
  # * MTX_SEGMENT_DURATION: segment duration
  # * RTSP_PORT: RTSP server port
  # * G1, G2, ...: regular expression groups, if path name is
  #   a regular expression.
  runOnRecordSegmentComplete: curl http://my-custom-server/webhook?path=$MTX_PATH&segment_path=$MTX_SEGMENT_PATH
```


---

<!-- source: https://mediamtx.org/docs/features/control-api -->

# Control API

The server can be queried and controlled with an API, that can be enabled by toggling the `api` parameter in the configuration:

```
api: yes
```

To obtain a list of active paths, run:

```
curl http://127.0.0.1:9997/v3/paths/list
```

The control API is documented in the [Control API Reference page](https://mediamtx.org/docs/references/control-api) and in the [OpenAPI / Swagger file](https://github.com/bluenviron/mediamtx/blob/v1.21.3/api/openapi.yaml).

Be aware that by default the Control API is accessible by localhost only; to increase visibility or enforce authentication, check [Authentication](https://mediamtx.org/docs/features/authentication).


---

<!-- source: https://mediamtx.org/docs/features/metrics -->

# Extract metrics

*MediaMTX* provides several metrics through a dedicated HTTP server, in a format compatible with [Prometheus](https://prometheus.io/).

This server can be enabled by setting `metrics: yes` in the configuration.

Metrics can be extracted with Prometheus or with a simple HTTP request:

```
curl http://localhost:9998/metrics
```

Obtaining:

```
# Paths
paths{name="[path_name]",state="[state]"} 1
paths_readers{name="[path_name]",state="[state]",readerType="[readerType]"} 5
paths_inbound_bytes{name="[path_name]",state="[state]"} 1234
paths_outbound_bytes{name="[path_name]",state="[state]"} 1234
paths_inbound_frames_in_error{name="[path_name]",state="[state]"} 1234

# HLS sessions
hls_sessions{id="[id]",path="[path]"} 1
hls_sessions_outbound_bytes{id="[id]",path="[path]"} 187

# HLS muxers
hls_muxers{name="[name]"} 1
hls_muxers_outbound_bytes{name="[name]"} 187
hls_muxers_outbound_frames_discarded{name="[name]"} 12

# RTSP connections
rtsp_conns{id="[id]"} 1
rtsp_conns_inbound_bytes{id="[id]"} 1234
rtsp_conns_outbound_bytes{id="[id]"} 187

# RTSP sessions
rtsp_sessions{id="[id]",path="[path]",state="[state]"} 1
rtsp_sessions_inbound_bytes{id="[id]",path="[path]",state="[state]"} 1234
rtsp_sessions_inbound_rtp_packets{id="[id]",path="[path]",state="[state]"} 123
rtsp_sessions_inbound_rtp_packets_lost{id="[id]",path="[path]",state="[state]"} 123
rtsp_sessions_inbound_rtp_packets_in_error{id="[id]",path="[path]",state="[state]"} 123
rtsp_sessions_inbound_rtp_packets_jitter{id="[id]",path="[path]",state="[state]"} 123
rtsp_sessions_inbound_rtcp_packets{id="[id]",path="[path]",state="[state]"} 123
rtsp_sessions_inbound_rtcp_packets_in_error{id="[id]",path="[path]",state="[state]"} 123
rtsp_sessions_outbound_bytes{id="[id]",path="[path]",state="[state]"} 187
rtsp_sessions_outbound_rtp_packets{id="[id]",path="[path]",state="[state]"} 123
rtsp_sessions_outbound_rtp_packets_reported_lost{id="[id]",path="[path]",state="[state]"} 123
rtsp_sessions_outbound_rtp_packets_discarded{id="[id]",path="[path]",state="[state]"} 123
rtsp_sessions_outbound_rtcp_packets{id="[id]",path="[path]",state="[state]"} 123

# RTSPS connections
rtsps_conns{id="[id]"} 1
rtsps_conns_inbound_bytes{id="[id]"} 1234
rtsps_conns_outbound_bytes{id="[id]"} 187

# RTSPS sessions
rtsps_sessions{id="[id]",path="[path]",state="[state]"} 1
rtsps_sessions_inbound_bytes{id="[id]",path="[path]",state="[state]"} 1234
rtsps_sessions_inbound_rtp_packets{id="[id]",path="[path]",state="[state]"} 123
rtsps_sessions_inbound_rtp_packets_lost{id="[id]",path="[path]",state="[state]"} 123
rtsps_sessions_inbound_rtp_packets_in_error{id="[id]",path="[path]",state="[state]"} 123
rtsps_sessions_inbound_rtp_packets_jitter{id="[id]",path="[path]",state="[state]"} 123
rtsps_sessions_inbound_rtcp_packets{id="[id]",path="[path]",state="[state]"} 123
rtsps_sessions_inbound_rtcp_packets_in_error{id="[id]",path="[path]",state="[state]"} 123
rtsps_sessions_outbound_bytes{id="[id]",path="[path]",state="[state]"} 187
rtsps_sessions_outbound_rtp_packets{id="[id]",path="[path]",state="[state]"} 123
rtsps_sessions_outbound_rtp_packets_reported_lost{id="[id]",path="[path]",state="[state]"} 123
rtsps_sessions_outbound_rtp_packets_discarded{id="[id]",path="[path]",state="[state]"} 123
rtsps_sessions_outbound_rtcp_packets{id="[id]",path="[path]",state="[state]"} 123

# RTMP connections
rtmp_conns{id="[id]",path="[path]",state="[state]"} 1
rtmp_conns_inbound_bytes{id="[id]",path="[path]",state="[state]"} 1234
rtmp_conns_outbound_bytes{id="[id]",path="[path]",state="[state]"} 187
rtmp_conns_outbound_frames_discarded{id="[id]",path="[path]",state="[state]"} 12

# RTMPS connections
rtmps_conns{id="[id]",path="[path]",state="[state]"} 1
rtmps_conns_inbound_bytes{id="[id]",path="[path]",state="[state]"} 1234
rtmps_conns_outbound_bytes{id="[id]",path="[path]",state="[state]"} 187
rtmps_conns_outbound_frames_discarded{id="[id]",path="[path]",state="[state]"} 12

# SRT connections
srt_conns{id="[id]",path="[path]",state="[state]"} 1
srt_conns_packets_sent{id="[id]",path="[path]",state="[state]"} 123
srt_conns_packets_received{id="[id]",path="[path]",state="[state]"} 123
srt_conns_packets_sent_unique{id="[id]",path="[path]",state="[state]"} 123
srt_conns_packets_received_unique{id="[id]",path="[path]",state="[state]"} 123
srt_conns_packets_send_loss{id="[id]",path="[path]",state="[state]"} 123
srt_conns_packets_received_loss{id="[id]",path="[path]",state="[state]"} 123
srt_conns_packets_retrans{id="[id]",path="[path]",state="[state]"} 123
srt_conns_packets_received_retrans{id="[id]",path="[path]",state="[state]"} 123
srt_conns_packets_sent_ack{id="[id]",path="[path]",state="[state]"} 123
srt_conns_packets_received_ack{id="[id]",path="[path]",state="[state]"} 123
srt_conns_packets_sent_nak{id="[id]",path="[path]",state="[state]"} 123
srt_conns_packets_received_nak{id="[id]",path="[path]",state="[state]"} 123
srt_conns_packets_sent_km{id="[id]",path="[path]",state="[state]"} 123
srt_conns_packets_received_km{id="[id]",path="[path]",state="[state]"} 123
srt_conns_us_snd_duration{id="[id]",path="[path]",state="[state]"} 123
srt_conns_packets_received_belated{id="[id]",path="[path]",state="[state]"} 123
srt_conns_packets_send_drop{id="[id]",path="[path]",state="[state]"} 123
srt_conns_packets_received_drop{id="[id]",path="[path]",state="[state]"} 123
srt_conns_packets_received_undecrypt{id="[id]",path="[path]",state="[state]"} 123
srt_conns_bytes_sent{id="[id]",path="[path]",state="[state]"} 187
srt_conns_bytes_received{id="[id]",path="[path]",state="[state]"} 1234
srt_conns_bytes_sent_unique{id="[id]",path="[path]",state="[state]"} 123
srt_conns_bytes_received_unique{id="[id]",path="[path]",state="[state]"} 123
srt_conns_bytes_received_loss{id="[id]",path="[path]",state="[state]"} 123
srt_conns_bytes_retrans{id="[id]",path="[path]",state="[state]"} 123
srt_conns_bytes_received_retrans{id="[id]",path="[path]",state="[state]"} 123
srt_conns_bytes_received_belated{id="[id]",path="[path]",state="[state]"} 123
srt_conns_bytes_send_drop{id="[id]",path="[path]",state="[state]"} 123
srt_conns_bytes_received_drop{id="[id]",path="[path]",state="[state]"} 123
srt_conns_bytes_received_undecrypt{id="[id]",path="[path]",state="[state]"} 123
srt_conns_us_packets_send_period{id="[id]",path="[path]",state="[state]"} 123.123
srt_conns_packets_flow_window{id="[id]",path="[path]",state="[state]"} 123
srt_conns_packets_flight_size{id="[id]",path="[path]",state="[state]"} 123
srt_conns_ms_rtt{id="[id]",path="[path]",state="[state]"} 123.123
srt_conns_mbps_send_rate{id="[id]",path="[path]",state="[state]"} 123.123
srt_conns_mbps_receive_rate{id="[id]",path="[path]",state="[state]"} 123.123
srt_conns_mbps_link_capacity{id="[id]",path="[path]",state="[state]"} 123.123
srt_conns_bytes_avail_send_buf{id="[id]",path="[path]",state="[state]"} 123
srt_conns_bytes_avail_receive_buf{id="[id]",path="[path]",state="[state]"} 123
srt_conns_mbps_max_bw{id="[id]",path="[path]",state="[state]"} -123
srt_conns_bytes_mss{id="[id]",path="[path]",state="[state]"} 123
srt_conns_packets_send_buf{id="[id]",path="[path]",state="[state]"} 123
srt_conns_bytes_send_buf{id="[id]",path="[path]",state="[state]"} 123
srt_conns_ms_send_buf{id="[id]",path="[path]",state="[state]"} 123
srt_conns_ms_send_tsb_pd_delay{id="[id]",path="[path]",state="[state]"} 123
srt_conns_packets_receive_buf{id="[id]",path="[path]",state="[state]"} 123
srt_conns_bytes_receive_buf{id="[id]",path="[path]",state="[state]"} 123
srt_conns_ms_receive_buf{id="[id]",path="[path]",state="[state]"} 123
srt_conns_ms_receive_tsb_pd_delay{id="[id]",path="[path]",state="[state]"} 123
srt_conns_packets_reorder_tolerance{id="[id]",path="[path]",state="[state]"} 123
srt_conns_packets_received_avg_belated_time{id="[id]",path="[path]",state="[state]"} 123
srt_conns_packets_send_loss_rate{id="[id]",path="[path]",state="[state]"} 123.123
srt_conns_packets_received_loss_rate{id="[id]",path="[path]",state="[state]"} 123.123
srt_conns_outbound_frames_discarded{id="[id]",path="[path]",state="[state]"} 12

# WebRTC sessions
webrtc_sessions{id="[id]",path="[path]",state="[state]"} 1
webrtc_sessions_inbound_bytes{id="[id]",path="[path]",state="[state]"} 1234
webrtc_sessions_inbound_rtp_packets{id="[id]",path="[path]",state="[state]"} 123
webrtc_sessions_inbound_rtp_packets_lost{id="[id]",path="[path]",state="[state]"} 123
webrtc_sessions_inbound_rtp_packets_jitter{id="[id]",path="[path]",state="[state]"} 123
webrtc_sessions_inbound_rtcp_packets{id="[id]",path="[path]",state="[state]"} 123
webrtc_sessions_outbound_bytes{id="[id]",path="[path]",state="[state]"} 187
webrtc_sessions_outbound_rtp_packets{id="[id]",path="[path]",state="[state]"} 123
webrtc_sessions_outbound_rtcp_packets{id="[id]",path="[path]",state="[state]"} 123
webrtc_sessions_outbound_frames_discarded{id="[id]",path="[path]",state="[state]"} 12

# MoQ sessions
moq_sessions{id="[id]",path="[path]",state="[state]"} 1
moq_sessions_inbound_bytes{id="[id]",path="[path]",state="[state]"} 1234
moq_sessions_outbound_bytes{id="[id]",path="[path]",state="[state]"} 187

# Forward destinations
forward_dests{pos="[pos]",id="[id]",path="[path]",type="[type]",state="[state]"} 1
forward_dests_outbound_bytes{pos="[pos]",id="[id]",path="[path]",type="[type]",state="[state]"} 1234
```

Bitrates are not provided directly as metrics because they can be computed from received and sent bytes by any metrics analyzer (for instance Grafana).

Metrics can be filtered by using HTTP query parameters:

- `type=[TYPE]`: show metrics of a certain type only. TYPE can be `paths`, `forward_dests`, `hls_sessions`, `hls_muxers`, `rtsp_conns`, `rtsp_sessions`, `rtsps_conns`, `rtsps_sessions`, `rtmp_conns`, `rtmps_conns`, `srt_conns`, `webrtc_sessions`, `moq_sessions`.
- `path=[PATH]`: show metrics belonging to a specific path only
- `hls_muxer=[PATH]`: show metrics belonging to a specific HLS muxer only
- `hls_session=[ID]`: show metrics belonging to a specific HLS session only
- `rtsp_conn=[ID]` show metrics belonging to a specific RTSP connection only
- `rtsp_session=[SESSION]`: show metrics belonging to a specific RTSP session only
- `rtsps_conn=[ID]` show metrics belonging to a specific RTSPS connection only
- `rtsps_session=[SESSION]`: show metrics belonging to a specific RTSPS session only
- `rtmp_conn=[ID]` show metrics belonging to a specific RTMP connection only
- `rtmps_conn=[ID]` show metrics belonging to a specific RTMPS connection only
- `srt_conn=[ID]` show metrics belonging to a specific SRT connection only
- `webrtc_session=[ID]` show metrics belonging to a specific WebRTC session only
- `forward_dest=[ID]` show metrics belonging to a specific forward destination only
- `moq_session=[ID]` show metrics belonging to a specific MoQ session only


---

<!-- source: https://mediamtx.org/docs/features/performance -->

# Monitor performance

CPU and memory consumption can be monitored over time through an integrated performance monitor, that produces reports in a format compatible with [pprof](https://github.com/google/pprof), which is a tool included in any Go installation.

The performance monitor can be enabled by setting `pprof: yes` in the configuration.

Reports can be extracted and displayed by using the `go tool pprof` command.

Occupied memory can be analyzed by running:

```
go tool pprof -text http://localhost:9999/debug/pprof/heap
```

Obtaining:

```
Fetching profile over HTTP from http://localhost:9999/debug/pprof/heap
Saved profile in /home/xxx/pprof/pprof.mediamtx.alloc_objects.alloc_space.inuse_objects.inuse_space.007.pb.gz
File: mediamtx
Build ID: dfb7c97dbb5e9ce59438172269231b35a873e3e9
Type: inuse_space
Time: Sep 99, 9999 at 12:00pm (CEST)
Showing nodes accounting for 5145.10kB, 100% of 5145.10kB total
      flat  flat%   sum%        cum   cum%
    2052kB 39.88% 39.88%     2052kB 39.88%  runtime.allocm
  525.43kB 10.21% 50.09%   525.43kB 10.21%  github.com/go-playground/validator/v10.map.init.7
  518.65kB 10.08% 60.18%   518.65kB 10.08%  github.com/go-playground/validator/v10.map.init.3
  512.75kB  9.97% 70.14%   512.75kB  9.97%  github.com/bluenviron/gortsplib/v4.(*serverUDPListener).run.func1 (inline)
  512.22kB  9.96% 80.10%   512.22kB  9.96%  runtime.malg
  512.02kB  9.95% 90.05%   512.02kB  9.95%  crypto/tls.init
  512.02kB  9.95%   100%   512.02kB  9.95%  internal/abi.NewName
         0     0%   100%   512.75kB  9.97%  github.com/bluenviron/gortsplib/v4.(*serverUDPListener).run
         0     0%   100%   512.02kB  9.95%  github.com/bluenviron/mediamtx/internal/conf.init
         0     0%   100%   512.02kB  9.95%  github.com/bluenviron/mediamtx/internal/conf.init.func2 (inline)
         0     0%   100%  1044.08kB 20.29%  github.com/go-playground/validator/v10.init
         0     0%   100%   512.02kB  9.95%  reflect.StructOf
         0     0%   100%   512.02kB  9.95%  reflect.newName (inline)
         0     0%   100%   512.02kB  9.95%  reflect.runtimeStructField
         0     0%   100%  2068.13kB 40.20%  runtime.doInit (inline)
         0     0%   100%  2068.13kB 40.20%  runtime.doInit1
         0     0%   100%  2068.13kB 40.20%  runtime.main
         0     0%   100%      513kB  9.97%  runtime.mcall
         0     0%   100%     1539kB 29.91%  runtime.mstart
         0     0%   100%     1539kB 29.91%  runtime.mstart0
         0     0%   100%     1539kB 29.91%  runtime.mstart1
         0     0%   100%     2052kB 39.88%  runtime.newm
         0     0%   100%   512.22kB  9.96%  runtime.newproc.func1
         0     0%   100%   512.22kB  9.96%  runtime.newproc1
         0     0%   100%      513kB  9.97%  runtime.park_m
         0     0%   100%     2052kB 39.88%  runtime.resetspinning
         0     0%   100%     2052kB 39.88%  runtime.schedule
         0     0%   100%     2052kB 39.88%  runtime.startm
         0     0%   100%   512.22kB  9.96%  runtime.systemstack
         0     0%   100%     2052kB 39.88%  runtime.wakep
```

Consumed CPU can be analyzed by running:

```
go tool pprof -text http://localhost:9999/debug/pprof/profile?seconds=15
```

Obtaining:

```
Fetching profile over HTTP from http://localhost:9999/debug/pprof/profile?seconds=15
Saved profile in /home/xxx/pprof/pprof.mediamtx.samples.cpu.003.pb.gz
File: mediamtx
Build ID: dfb7c97dbb5e9ce59438172269231b35a873e3e9
Type: cpu
Time: Sep 99, 9999 at 12:00pm (CEST)
Duration: 15s, Total samples = 0
Showing nodes accounting for 70ms, 100% of 70ms total
      flat  flat%   sum%        cum   cum%
      30ms 42.86% 42.86%       30ms 42.86%  internal/runtime/syscall.Syscall6
      10ms 14.29% 57.14%       10ms 14.29%  runtime.(*consistentHeapStats).acquire
      10ms 14.29% 71.43%       10ms 14.29%  runtime.futex
      10ms 14.29% 85.71%       10ms 14.29%  runtime.mapIterStart
      10ms 14.29%   100%       10ms 14.29%  runtime.netpollblockcommit
         0     0%   100%       10ms 14.29%  github.com/bluenviron/gortsplib/v4.(*serverSessionFormat).readPacketRTP
         0     0%   100%       10ms 14.29%  github.com/bluenviron/gortsplib/v4.(*serverSessionMedia).readPacketRTPUDPRecord
         0     0%   100%       50ms 71.43%  github.com/bluenviron/gortsplib/v4.(*serverUDPListener).run
         0     0%   100%       10ms 14.29%  github.com/bluenviron/gortsplib/v4.(*serverUDPListener).run.func2
         0     0%   100%       10ms 14.29%  github.com/bluenviron/mediamtx/internal/protocols/rtsp.ToStream.func2
         0     0%   100%       10ms 14.29%  github.com/bluenviron/mediamtx/internal/stream.(*Stream).WriteRTPPacket
         0     0%   100%       10ms 14.29%  github.com/bluenviron/mediamtx/internal/stream.(*streamFormat).writeRTPPacket
         0     0%   100%       10ms 14.29%  github.com/bluenviron/mediamtx/internal/stream.(*streamFormat).writeUnitInner
         0     0%   100%       30ms 42.86%  internal/poll.(*FD).ReadFromInet6
         0     0%   100%       10ms 14.29%  internal/runtime/syscall.EpollWait
         0     0%   100%       40ms 57.14%  net.(*UDPConn).ReadFrom
         0     0%   100%       30ms 42.86%  net.(*UDPConn).readFrom
         0     0%   100%       30ms 42.86%  net.(*UDPConn).readFromUDP
         0     0%   100%       30ms 42.86%  net.(*netFD).readFromInet6
         0     0%   100%       10ms 14.29%  runtime.(*mcache).nextFree
         0     0%   100%       10ms 14.29%  runtime.(*mcache).refill
         0     0%   100%       10ms 14.29%  runtime.entersyscall
         0     0%   100%       10ms 14.29%  runtime.entersyscall_sysmon
         0     0%   100%       10ms 14.29%  runtime.findRunnable
         0     0%   100%       10ms 14.29%  runtime.futexwakeup
         0     0%   100%       10ms 14.29%  runtime.mallocgc
         0     0%   100%       10ms 14.29%  runtime.mallocgcSmallScanNoHeader
         0     0%   100%       20ms 28.57%  runtime.mcall
         0     0%   100%       10ms 14.29%  runtime.netpoll
         0     0%   100%       10ms 14.29%  runtime.newobject
         0     0%   100%       10ms 14.29%  runtime.notewakeup
         0     0%   100%       20ms 28.57%  runtime.park_m
         0     0%   100%       10ms 14.29%  runtime.reentersyscall
         0     0%   100%       10ms 14.29%  runtime.schedule
         0     0%   100%       10ms 14.29%  runtime.systemstack
         0     0%   100%       20ms 28.57%  syscall.RawSyscall6
         0     0%   100%       30ms 42.86%  syscall.Syscall6
         0     0%   100%       30ms 42.86%  syscall.recvfrom
         0     0%   100%       30ms 42.86%  syscall.recvfromInet6
```

Active routines can be listed by running:

```
go tool pprof -text http://localhost:9999/debug/pprof/goroutine
```

Obtaining:

```
Fetching profile over HTTP from http://localhost:9999/debug/pprof/goroutine
Saved profile in /home/xxx/pprof/pprof.mediamtx.goroutine.044.pb.gz
File: mediamtx
Build ID: dfb7c97dbb5e9ce59438172269231b35a873e3e9
Type: goroutine
Time: Sep 99, 9999 at 12:00pm (CEST)
Showing nodes accounting for 27, 100% of 27 total
      flat  flat%   sum%        cum   cum%
        25 92.59% 92.59%         25 92.59%  runtime.gopark
         1  3.70% 96.30%          1  3.70%  runtime.goroutineProfileWithLabels
         1  3.70%   100%          1  3.70%  runtime.notetsleepg
         0     0%   100%          1  3.70%  github.com/bluenviron/gortsplib/v4.(*Server).Wait (inline)
         0     0%   100%          1  3.70%  github.com/bluenviron/gortsplib/v4.(*Server).run
         0     0%   100%          1  3.70%  github.com/bluenviron/gortsplib/v4.(*Server).runInner
         0     0%   100%          1  3.70%  github.com/bluenviron/gortsplib/v4.(*serverTCPListener).run
         0     0%   100%          2  7.41%  github.com/bluenviron/gortsplib/v4.(*serverUDPListener).run
         0     0%   100%          1  3.70%  github.com/bluenviron/mediamtx/internal/confwatcher.(*ConfWatcher).run
         0     0%   100%          1  3.70%  github.com/bluenviron/mediamtx/internal/core.(*Core).Wait (inline)
         0     0%   100%          1  3.70%  github.com/bluenviron/mediamtx/internal/core.(*Core).run
         0     0%   100%          1  3.70%  github.com/bluenviron/mediamtx/internal/core.(*pathManager).run
         0     0%   100%          1  3.70%  github.com/bluenviron/mediamtx/internal/protocols/httpp.(*handlerExitOnPanic).ServeHTTP
         0     0%   100%          1  3.70%  github.com/bluenviron/mediamtx/internal/protocols/httpp.(*handlerFilterRequests).ServeHTTP
         0     0%   100%          1  3.70%  github.com/bluenviron/mediamtx/internal/protocols/httpp.(*handlerLogger).ServeHTTP
         0     0%   100%          1  3.70%  github.com/bluenviron/mediamtx/internal/protocols/httpp.(*handlerServerHeader).ServeHTTP
         0     0%   100%          1  3.70%  github.com/bluenviron/mediamtx/internal/recordcleaner.(*Cleaner).run
         0     0%   100%          1  3.70%  github.com/bluenviron/mediamtx/internal/servers/hls.(*Server).run
         0     0%   100%          1  3.70%  github.com/bluenviron/mediamtx/internal/servers/rtmp.(*Server).run
         0     0%   100%          1  3.70%  github.com/bluenviron/mediamtx/internal/servers/rtmp.(*listener).run
         0     0%   100%          1  3.70%  github.com/bluenviron/mediamtx/internal/servers/rtmp.(*listener).runInner
         0     0%   100%          1  3.70%  github.com/bluenviron/mediamtx/internal/servers/rtsp.(*Server).run
         0     0%   100%          1  3.70%  github.com/bluenviron/mediamtx/internal/servers/rtsp.(*Server).run.func1
         0     0%   100%          1  3.70%  github.com/bluenviron/mediamtx/internal/servers/srt.(*Server).run
         0     0%   100%          1  3.70%  github.com/bluenviron/mediamtx/internal/servers/srt.(*listener).run
         0     0%   100%          1  3.70%  github.com/bluenviron/mediamtx/internal/servers/srt.(*listener).runInner
         0     0%   100%          1  3.70%  github.com/bluenviron/mediamtx/internal/servers/webrtc.(*Server).run
         0     0%   100%          1  3.70%  github.com/datarhei/gosrt.(*listener).Accept2
         0     0%   100%          1  3.70%  github.com/datarhei/gosrt.(*listener).reader
         0     0%   100%          1  3.70%  github.com/datarhei/gosrt.Listen.func1
         0     0%   100%          1  3.70%  github.com/fsnotify/fsnotify.(*inotify).readEvents
         0     0%   100%          1  3.70%  github.com/gin-contrib/pprof.RouteRegister.WrapH.func9
         0     0%   100%          1  3.70%  github.com/gin-gonic/gin.(*Context).Next (inline)
         0     0%   100%          1  3.70%  github.com/gin-gonic/gin.(*Engine).ServeHTTP
         0     0%   100%          1  3.70%  github.com/gin-gonic/gin.(*Engine).handleHTTPRequest
         0     0%   100%          1  3.70%  github.com/pion/ice/v4.(*UDPMuxDefault).connWorker
         0     0%   100%          5 18.52%  internal/poll.(*FD).Accept
         0     0%   100%          2  7.41%  internal/poll.(*FD).Read
         0     0%   100%          4 14.81%  internal/poll.(*FD).ReadFromInet6
         0     0%   100%         11 40.74%  internal/poll.(*pollDesc).wait
         0     0%   100%         11 40.74%  internal/poll.(*pollDesc).waitRead (inline)
         0     0%   100%         11 40.74%  internal/poll.runtime_pollWait
         0     0%   100%          1  3.70%  main.main
         0     0%   100%          5 18.52%  net.(*TCPListener).Accept
         0     0%   100%          5 18.52%  net.(*TCPListener).accept
         0     0%   100%          4 14.81%  net.(*UDPConn).ReadFrom
         0     0%   100%          4 14.81%  net.(*UDPConn).readFrom
         0     0%   100%          4 14.81%  net.(*UDPConn).readFromUDP
         0     0%   100%          1  3.70%  net.(*conn).Read
         0     0%   100%          1  3.70%  net.(*netFD).Read
         0     0%   100%          5 18.52%  net.(*netFD).accept
         0     0%   100%          4 14.81%  net.(*netFD).readFromInet6
         0     0%   100%          3 11.11%  net/http.(*Server).Serve
         0     0%   100%          1  3.70%  net/http.(*conn).serve
         0     0%   100%          1  3.70%  net/http.(*connReader).backgroundRead
         0     0%   100%          1  3.70%  net/http.serverHandler.ServeHTTP
         0     0%   100%          1  3.70%  net/http/pprof.handler.ServeHTTP
         0     0%   100%          1  3.70%  os.(*File).Read
         0     0%   100%          1  3.70%  os.(*File).read (inline)
         0     0%   100%          1  3.70%  os/signal.loop
         0     0%   100%          1  3.70%  os/signal.signal_recv
         0     0%   100%          1  3.70%  runtime.chanrecv
         0     0%   100%          1  3.70%  runtime.chanrecv1
         0     0%   100%          1  3.70%  runtime.goparkunlock (inline)
         0     0%   100%          1  3.70%  runtime.main
         0     0%   100%         11 40.74%  runtime.netpollblock
         0     0%   100%          1  3.70%  runtime.pprof_goroutineProfileWithLabels
         0     0%   100%         12 44.44%  runtime.selectgo
         0     0%   100%          1  3.70%  runtime.semacquire1
         0     0%   100%          1  3.70%  runtime/pprof.(*Profile).WriteTo
         0     0%   100%          1  3.70%  runtime/pprof.writeGoroutine
         0     0%   100%          1  3.70%  runtime/pprof.writeRuntimeProfile
         0     0%   100%          1  3.70%  sync.(*WaitGroup).Wait
         0     0%   100%          1  3.70%  sync.runtime_SemacquireWaitGroup
```


---

<!-- source: https://mediamtx.org/docs/features/srt-specific-features -->

# SRT-specific features

SRT is a protocol that can be used for publishing and reading streams. Regarding specific tasks, check out [Publish with SRT clients](https://mediamtx.org/docs/publish/srt) and [Read with SRT clients](https://mediamtx.org/docs/read/srt). Features in this page are shared among both tasks.

## Standard stream ID syntax

In SRT, the stream ID is a string that is sent to the remote part in order to advertise what action the caller is going to do (publish or read), the path and the credentials. All this information has to be encoded into a single string. This server supports two stream ID syntaxes, a custom one (that is the one reported in the rest of the README) and also a [standard one](https://github.com/Haivision/srt/blob/master/docs/features/access-control.md) proposed by the authors of the protocol and enforced by some hardware. The standard syntax can be used in this way:

```
srt://localhost:8890?streamid=#!::m=publish,r=mypath,u=myuser,s=mypass&pkt_size=1316
```

Where:

- key `m` contains the action (`publish` or `request`)
- key `r` contains the path
- key `u` contains the username
- key `s` contains the password


---

<!-- source: https://mediamtx.org/docs/features/webrtc-specific-features -->

# WebRTC-specific features

WebRTC is a protocol that can be used for publishing and reading streams. Regarding specific tasks, check out [Publish with WebRTC clients](https://mediamtx.org/docs/publish/webrtc) and [Read with WebRTC clients](https://mediamtx.org/docs/read/webrtc). Features in this page are shared among both tasks.

## Codec support in browsers

WebRTC can be used to publish and read streams encoded with a wide variety of video and audio codecs, but not every browser can publish and read streams with every codec due to internal limitations that cannot be overcome by this or any other server.

You can check what codecs your browser supports by [using this tool](https://jsfiddle.net/v24s8q1f/).

In particular, the following codecs might cause compatibility issues:

- H265. Lots of browsers do not support reading H265 tracks with WebRTC, others do only if some strict conditions are met. For instance, Chrome supports publishing and reading H265 tracks only on Windows and only when a capable GPU is present.
- H264, when the stream contains B-frames. These are not part of the WebRTC specification and support for them has been intentionally left out by every browser.

In order to support most browsers, you can re-encode the stream by using the H264 codec with the baseline profile (which does not produce B-frames) and the Opus codec, for instance by using FFmpeg:

```
ffmpeg -i rtsp://original-source \
-c:v libx264 -pix_fmt yuv420p -preset ultrafast -b:v 600k \
-c:a libopus -b:a 64K -async 50 \
-f rtsp rtsp://localhost:8554/mystream
```

## Solving WebRTC connectivity issues

In WebRTC, the handshake between server and clients happens through standard HTTP requests and responses, while media streaming takes place inside a dedicated communication channel (peer connection) that is set up shortly after the handshake. The server supports establishing peer connections through the following methods (ordered by efficiency and simplicity):

1. using a static UDP server port (`webrtcLocalUDPAddress` must be filled, it is by default)
2. using a static TCP server port (`webrtcLocalTCPAddress` must be filled, it is not by default)
3. using a random UDP server port and UDP client port with the hole-punching technique (`webrtcICEServers2` must contain a STUN server, not present by default)
4. using a relay (TURN server) that exposes a TCP port that is accessed by both server and clients (`webrtcICEServers2` must contain a TURN server, not present by default)

Establishing the peer connection might get difficult when the server is hosted inside a container or there is a NAT / firewall between server and clients.

The first thing to do is making sure that `webrtcAdditionalHosts` includes your public IPs, that are IPs that can be used by clients to reach the server. If clients are on the same LAN as the server, add the LAN address of the server. If clients are coming from the internet, add the public IP address of the server, or alternatively a DNS name, if you have one. You can add several values to support all scenarios:

```
webrtcAdditionalHosts: [192.168.x.x, 1.2.3.4, my-dns.example.org, ...]
```

If there’s a NAT / container between server and clients, it must be configured to route all incoming UDP packets on port 8189 to the server. If you’re using Docker, this can be achieved with the flag:

```
docker run --rm -it \
-p 8189:8189/udp
....
bluenviron/mediamtx:1
```

If you still have problems, the UDP protocol might be blocked by a firewall. Switch to the TCP protocol by enabling the TCP server port:

```
webrtcLocalTCPAddress: :8189
```

If there’s a NAT / container between server and clients, it must be configured to route all incoming TCP packets on port 8189 to the server.

If you still have problems, add a STUN server, that is used by both server and clients to find out their public IP. Connections are then established with the “UDP hole punching” technique, that uses a random UDP port that does not need to be explicitly opened. For instance:

```
webrtcICEServers2:
  - url: stun:stun.l.google.com:19302
```

If you really still have problems, you can force all WebRTC/ICE connections to pass through a TURN server. The server address and credentials must be set in the configuration file:

```
webrtcICEServers2:
  - url: turn:host:port
    username: user
    password: password
```

Where user and pass are the username and password of the server. Note that port is not optional.

If the server uses a secret-based authentication (for instance, Coturn with the use-auth-secret option), it must be configured by using AUTH_SECRET as username, and the secret as password:

```
webrtcICEServers2:
  - url: turn:host:port
    username: AUTH_SECRET
    password: secret
```

Where secret is the secret of the TURN server. *MediaMTX* will generate a set of credentials by using the secret, and credentials will be sent to clients before the WebRTC/ICE connection is established.

In some cases you may want the browser to connect using TURN servers but have *MediaMTX* not using TURN (for example if the TURN server is on the same network as mediamtx). To allow this you can configure the TURN server to be client only:

```
webrtcICEServers2:
  - url: turn:host:port
    username: user
    password: password
    clientOnly: true
```

## Coturn setup

Here’s how to setup the [Coturn](https://github.com/coturn/coturn) TURN server and use it with *MediaMTX*. This is needed only if all other WebRTC connectivity methods have failed. Start Coturn with Docker:

```
docker run --rm -it \
--network=host \
coturn/coturn \
--log-file=stdout -v \
--no-udp --no-dtls --no-tls \
--min-port=49152 --max-port=65535 \
--use-auth-secret --static-auth-secret=mysecret -r myrealm
```

We are suggesting and using the following settings:

- enable the TCP transport only. We are assuming you are setting up Coturn because other connectivity methods have failed, thus TCP is more reliable.
- toggle `--network=host` since Coturn allocates a TCP port for each peer connection.
- set `min-port` and `max-port` to specify the range of TCP ports.
- enable secret-based authentication, that prevents clients from storing permanently valid credentials.

Configure MediaMTX to use the TURN server:

```
webrtcICEServers2:
  - url: turn:REPLACE_WITH_COTURN_IP:3478?transport=tcp
    username: AUTH_SECRET
    password: mysecret
```

The `?transport=tcp` suffix is needed to force TCP usage. Use `AUTH_SECRET` as username and the shared secret as the password.


---

<!-- source: https://mediamtx.org/docs/features/rtsp-specific-features -->

# RTSP-specific features

RTSP is a protocol that can be used for publishing and reading streams. Regarding specific tasks, check out [Publish with RTSP clients](https://mediamtx.org/docs/publish/rtsp) and [Read with RTSP clients](https://mediamtx.org/docs/read/rtsp). Features in this page are shared among both tasks.

## Transport protocols

A RTSP session is split in two parts: the handshake, which is always performed with the TCP protocol, and data streaming, which can be performed with an arbitrary underlying transport protocol, which is chosen by the client during the handshake:

- UDP: the most performant, but requires clients to access two additional UDP ports on the server, which is often impossible due to blocking or remapping by NATs/firewalls in between.
- UDP-multicast: allows to save bandwidth when clients are all in the same LAN, by sending packets once to a fixed multicast IP.
- TCP: the most versatile.

To change the transport protocol, you have to tune the configuration of the client you are using to publish or read streams. In most clients, the default transport protocol is UDP.

FFmpeg allows to change the transport protocol with the `-rtsp_transport` flag:

```
ffmpeg -rtsp_transport tcp -i rtsp://localhost:8554/mystream -c copy output.mp4
```

Available options are:

- `-rtsp_transport tcp` to pick the TCP transport protocol
- `-rtsp_transport udp` to pick the UDP transport protocol
- `-rtsp_transport udp_multicast` to pick the UDP-multicast transport protocol

GStreamer allows to change the transport protocol with the `protocols` property of `rtspsrc` and `rtspclientsink`:

```
gst-launch-1.0 filesrc location=file.mp4 ! qtdemux name=d \
d.video_0 ! rtspclientsink location=rtsp://localhost:8554/mystream protocols=tcp
```

Available options are:

- `protocols=tcp` to pick the TCP transport protocol
- `protocols=udp` to pick the UDP transport protocol
- `protocols=udp-mcast` to pick the UDP-multicast transport protocol

VLC allows to use the TCP transport protocol through the `--rtsp_tcp` flag:

```
vlc --network-caching=50 --rtsp-tcp rtsp://localhost:8554/mystream
```

VLC allows to use the UDP-multicast transport protocol by appending `?vlcmulticast` to the URL:

```
vlc --network-caching=50 rtsp://localhost:8554/mystream?vlcmulticast
```

## Encryption

Incoming and outgoing RTSP streams can be encrypted by replacing all the subprotocols that are normally used in RTSP with their secure variants (RTSPS, SRTP, SRTCP). A TLS certificate is needed and can be generated with OpenSSL:

```
openssl genrsa -out server.key 2048
openssl req -new -x509 -sha256 -key server.key -out server.crt -days 3650
```

Edit `mediamtx.yml` and set the `encryption`, `serverKey` and serverCert parameters:

```
rtspEncryption: optional
rtspServerKey: server.key
rtspServerCert: server.crt
```

Streams can be published and read with the `rtsps` scheme and the `8322` port:

```
rtsps://localhost:8322/mystream
```

Some clients require additional flags for encryption to work properly.

When reading with GStreamer, set `tls-validation-flags` to `0`:

```
gst-launch-1.0 rtspsrc tls-validation-flags=0 location=rtsps://ip:8322/...
```

When publishing with GStreamer, set `tls-validation-flags` to `0` and `profiles` to `GST_RTSP_PROFILE_SAVP`:

```
gst-launch-1.0 filesrc location=file.mp4 ! qtdemux name=d \
d.video_0 ! rtspclientsink location=rtsp://localhost:8554/mystream tls-validation-flags=0 profiles=GST_RTSP_PROFILE_SAVP
```

## Tunneling

In environments where HTTP is the only protocol available for exposing services (for instance, when there are mandatory API gateways or strict firewalls), the RTSP protocol can be tunneled inside HTTP. There are two standardized HTTP tunneling variants:

- RTSP over WebSocket: more efficient, requires WebSocket support from the gateway / firewall
- RTSP over HTTP: older variant, should work even in extreme cases

*MediaMTX* is automatically able to handle incoming HTTP-tunneled RTSP connections without any configuration required.

In order to read a stream from an external RTSP server using HTTP tunneling, you can use the `rtsp+http` scheme:

```
paths:
  source: rtsp+http://standard-rtsp-url
```

There are also the `rtsps+http`, `rtsp+ws`, `rtsps+ws` schemes to handle any variant.

## MPEG-TS inside RTSP

read [MPEG-TS inside RTSP](https://mediamtx.org/docs/publish/rtsp#mpeg-ts-inside-rtsp) in the “Publish with RTSP clients” page.


---

<!-- source: https://mediamtx.org/docs/features/rtmp-specific-features -->

# RTMP-specific features

RTMP is a protocol that can be used for publishing and reading streams. Regarding specific tasks, check out [Publish with RTMP clients](https://mediamtx.org/docs/publish/rtmp) and [Read with RTMP clients](https://mediamtx.org/docs/read/rtmp). Features in this page are shared among both tasks.

## Encryption

RTMP connections can be encrypted by using the secure protocol variant (RTMPS). A TLS certificate is needed and can be generated with OpenSSL:

```
openssl genrsa -out server.key 2048
openssl req -new -x509 -sha256 -key server.key -out server.crt -days 3650
```

Edit mediamtx.yml and set the `rtmpEncryption`, `rtmpServerKey` and `rtmpServerCert` parameters:

```
rtmpEncryption: optional
rtmpServerKey: server.key
rtmpServerCert: server.crt
```

Streams can be published and read with the rtmps scheme and the 1937 port:

```
rtmps://localhost:1937/...
```

Be aware that RTMPS is currently unsupported by most major players. However, you can use a local *MediaMTX* instance to decrypt streams before reading them, or alternatively a proxy like [stunnel](https://www.stunnel.org) or [nginx](https://nginx.org/). For instance, you can launch a local *MediaMTX* instance with this configuration:

```
paths:
  decrypted:
    source: rtmps://original-stream
```

And then read `rtmp://localhost/decrypted` instead of `rtmps://original-stream`.


---

<!-- source: https://mediamtx.org/docs/features/decrease-packet-loss -->

# Decrease packet loss

MediaMTX is meant for routing live streams, and makes use of a series of protocols and techniques which try to preserve the real-time aspect of streams and minimize latency at cost of losing packets in transmit, in particular:

- most protocols are built on UDP, which is an “unreliable transport”, specifically picked because it allows dropping late packets in case of network congestion.
- there’s a circular buffer that stores outgoing packets and drops packets if full.

Packet losses are usually detected and printed in *MediaMTX* logs.

If you need to improve the stream reliability and decrease packet losses, the first thing to do is to check whether the physical network between the *MediaMTX* instance and the intended publishers and readers has sufficient bandwidth for transmitting the media stream. Most of the time, packet losses are caused by a network which is not fit for this scope. This limitation can be overcome by either recompressing the stream with a lower bitrate, or by upgrading the network infrastructure (routers, cables, Wi-Fi, firewalls, topology, etc).

Nonetheless there are some parameters that can be tuned to improve the situation, at cost of increasing RAM consumption:

- When publishing a stream with a UDP-based protocol (currently RTSP, MPEG-TS, RTP, SRT, WebRTC), packets might get discarded by the server because the read buffer size of UDP sockets is too small. It can be increased with this parameter:`udpReadBufferSize: 1000000`The `udpReadBufferSize` parameter requires the `net.core.rmem_max` system parameter to be equal or greater than it. It can be set with this command:`sudo sysctl net.core.rmem_max=100000000`
- When reading a stream, packets might get discarded because the write queue is too small. This can be noticed in logs through the “reader is too slow” message. Try increasing the write queue:`writeQueueSize: 1024`
- When publishing or reading a stream with RTSP, it’s possible to switch from the UDP transport protocol to the TCP transport protocol, which is less performant but has a packet retransmission mechanism:`rtspTransports: [tcp]`In case the source is a camera:`paths:  test:  source: rtsp://..  rtspTransport: tcp`


---

<!-- source: https://mediamtx.org/docs/publish/moq -->

# Media-over-QUIC clients

|  | supported codecs |
|---|---|
| **video** | AV1, VP9, VP8, H265, H264 |
| **audio** | Opus, MPEG-4 Audio (AAC) |

Media-over-QUIC is a streaming protocol built upon cutting edge protocols (QUIC, HTTP3) and browser APIs (WebTransport, WebCodecs) that can be used to publish and read live media streams. It’s slightly faster than WebRTC, has an advanced data recovery mechanism, supports additional codecs (FLAC and future ones), supports B-frames and is less complicated to route.

Media-over-QUIC has a wide range of features and variants, most of them in active development. We currently support the following:

- The server supports drafts 16 through 22 of the [main specification](https://datatracker.ietf.org/doc/html/draft-ietf-moq-transport-22), and prefers draft 22 when multiple versions are offered during negotiation.
- We support using Media-over-QUIC through browsers with the WebTransport API and through native QUIC clients.
- We support the `PUBLISH` and `SUBSCRIBE` messages only, which are the ones meant to be used with a routing solution like *MediaMTX*.
- We use the MOQT Streaming Format (MSF) to advertise tracks, described in [this specification](https://datatracker.ietf.org/doc/html/draft-ietf-moq-msf-00).
- We use the Low Overhead Media Container (LOC) to ship frames, described in [this specification](https://datatracker.ietf.org/doc/draft-ietf-moq-loc/).
- We host web pages through a HTTP/2 listener and host the WebTransport endpoint through a HTTP/3 listener. This hybrid setup allows to use self-signed certificates, that are normally forbidden in pure HTTP/3.

There are some server requirements:

- HTTPS is mandatory.
- Clients must be able to access both the HTTP/2 listener (`:8892/TCP`) and the HTTP/3 listener (`:8892/UDP`).
- If the server is behind Docker, NAT or a firewall, expose and forward both `8892/TCP` and `8892/UDP` to the server.

And there are some client (browser) requirements:

- If the server certificate is self-signed, browser must support the [serverCertificatesHashes option](https://caniuse.com/mdn-api_webtransport_webtransport_options_servercertificatehashes_parameter) (all except iOS Safari do).
- Browser must support [WebTransport](https://caniuse.com/webtransport) and [WebCodecs](https://caniuse.com/webcodecs) (all modern browsers do)
- When publishing tracks, browser must support [MediaStreamTrackProcessor](https://caniuse.com/mdn-api_mediastreamtrackprocessor) (only Chrome does).

You can publish a stream with Media-over-QUIC and a web browser by visiting:

```
https://localhost:8892/mystream/publish
```

You can also publish with native QUIC clients by connecting directly to `moqQUICAddress` (default is `:8893`).


---

<!-- source: https://mediamtx.org/docs/publish/srt -->

# SRT clients

|  | supported codecs |
|---|---|
| **video** | H265, H264, MPEG-4 Video (H263, Xvid), MPEG-1/2 Video |
| **audio** | Opus, MPEG-4 Audio (AAC), MPEG-1/2 Audio (MP3), AC-3 |
| **other** | KLV |

SRT is a protocol that allows to publish and read live data stream, providing encryption, integrity and a retransmission mechanism. It is usually used to transfer media streams encoded with MPEG-TS. In order to publish a stream to the server with the SRT protocol, use this URL:

```
srt://localhost:8890?streamid=publish:mystream&pkt_size=1316
```

Replace `mystream` with any name you want. The resulting stream will be available on path `/mystream`.

If you need to use the standard stream ID syntax instead of the custom one in use by this server, read [Standard stream ID syntax](https://mediamtx.org/docs/features/srt-specific-features#standard-stream-id-syntax).

If you want to publish a stream by using a client in listening mode (i.e. with `mode=listener` appended to the URL), read the next section.

Some clients that can publish with SRT are [FFmpeg](https://mediamtx.org/docs/publish/ffmpeg), [GStreamer](https://mediamtx.org/docs/publish/gstreamer), [OBS Studio](https://mediamtx.org/docs/publish/obs-studio).


---

<!-- source: https://mediamtx.org/docs/publish/webrtc -->

# WebRTC clients

|  | supported codecs |
|---|---|
| **video** | AV1, VP9, VP8, H265, H264 |
| **audio** | Opus, G722, G711 (PCMA, PCMU) |

WebRTC is an API that makes use of a set of protocols and methods to connect two clients together and allow them to exchange live media or data streams. You can publish a stream with WebRTC and a web browser by visiting:

```
http://localhost:8889/mystream/publish
```

The resulting stream will be available on path `/mystream`.

WHIP is a WebRTC extension that allows to publish streams by using a URL, without passing through a web page. This allows to use WebRTC as a general purpose streaming protocol. If you are using a software that supports WHIP (for instance, latest versions of OBS Studio), you can publish a stream to the server by using this URL:

```
http://localhost:8889/mystream/whip
```

Be aware that not all browsers can publish tracks with any codec, check [Codec support in browsers](https://mediamtx.org/docs/features/webrtc-specific-features#codec-support-in-browsers).

Depending on the network it might be difficult to establish a connection between server and clients, read [Solving WebRTC connectivity issues](https://mediamtx.org/docs/features/webrtc-specific-features#solving-webrtc-connectivity-issues).

Some clients that can publish with WebRTC and WHIP are [FFmpeg](https://mediamtx.org/docs/publish/ffmpeg), [GStreamer](https://mediamtx.org/docs/publish/gstreamer), [OBS Studio](https://mediamtx.org/docs/publish/obs-studio), [Unity](https://mediamtx.org/docs/publish/unity) and [Web browsers](https://mediamtx.org/docs/publish/web-browsers).


---

<!-- source: https://mediamtx.org/docs/publish/rtsp -->

# RTSP clients

|  | supported codecs |
|---|---|
| **video** | AV1, VP9, VP8, H265, H264, MPEG-4 Video (H263, Xvid), MPEG-1/2 Video, MJPEG |
| **audio** | Opus, MPEG-4 Audio (AAC), MPEG-1/2 Audio (MP3), AC-3, G726, G722, G711 (PCMA, PCMU), LPCM |
| **other** | KLV, MPEG-TS, any RTP-compatible codec |

RTSP is a protocol that allows to publish and read streams. It supports several underlying transport protocols and encryption. In order to publish a stream to the server with the RTSP protocol, use this URL:

```
rtsp://localhost:8554/mystream
```

The resulting stream will be available on path `/mystream`.

Some clients that can publish with RTSP are [FFmpeg](https://mediamtx.org/docs/publish/ffmpeg), [GStreamer](https://mediamtx.org/docs/publish/gstreamer), [OBS Studio](https://mediamtx.org/docs/publish/obs-studio), [Python and OpenCV](https://mediamtx.org/docs/publish/python-opencv).

Advanced RTSP features and settings are described in [RTSP-specific features](https://mediamtx.org/docs/features/rtsp-specific-features).

## MPEG-TS inside RTSP

Some RTSP clients encode tracks with MPEG-TS before sending them to the server, causing the server to see a single “MPEG-TS” track, and preventing track conversion from a protocol to another.

It is possible to automatically demux these MPEG-TS-encoded streams by toggling `rtspDemuxMpegts`:

```
pathDefaults:
  rtspDemuxMpegts: true
```


---

<!-- source: https://mediamtx.org/docs/publish/rtmp -->

# RTMP clients

|  | supported codecs |
|---|---|
| **video** | AV1, VP9, H265, H264 |
| **audio** | Opus, FLAC, MPEG-4 Audio (AAC), MPEG-1/2 Audio (MP3), AC-3, G711 (PCMA, PCMU), LPCM |

RTMP is a protocol that allows to read and publish streams. It has been expanded to support modern codecs (Enhanced RTMP) and it supports encryption, read [RTMP-specific features](https://mediamtx.org/docs/features/rtmp-specific-features). Streams can be published to the server by using the URL:

```
rtmp://localhost/mystream
```

The resulting stream will be available on path `/mystream`.

Some clients that can publish with RTMP are [FFmpeg](https://mediamtx.org/docs/publish/ffmpeg), [GStreamer](https://mediamtx.org/docs/publish/gstreamer) and [OBS Studio](https://mediamtx.org/docs/publish/obs-studio).


---

<!-- source: https://mediamtx.org/docs/publish/generic-webcams -->

# Generic webcams

If the operating system is Linux, edit `mediamtx.yml` and replace everything inside section `paths` with the following content:

```
paths:
  cam:
    runOnInit: ffmpeg -f v4l2 -i /dev/video0 -c:v libx264 -pix_fmt yuv420p -preset ultrafast -b:v 600k -f rtsp rtsp://localhost:$RTSP_PORT/$MTX_PATH
    runOnInitRestart: yes
```

If the operating system is Windows:

```
paths:
  cam:
    runOnInit: ffmpeg -f dshow -i video="USB2.0 HD UVC WebCam" -c:v libx264 -pix_fmt yuv420p -preset ultrafast -b:v 600k -f rtsp rtsp://localhost:$RTSP_PORT/$MTX_PATH
    runOnInitRestart: yes
```

Where `USB2.0 HD UVC WebCam` is the name of a webcam, that can be obtained with:

```
ffmpeg -list_devices true -f dshow -i dummy
```

The resulting stream will be available on path `/cam`.


---

<!-- source: https://mediamtx.org/docs/publish/web-browsers -->

# Web browsers

Web browsers can publish a stream to the server by acting as a [Media-over-QUIC client](https://mediamtx.org/docs/publish/moq) or a [WebRTC client](https://mediamtx.org/docs/publish/webrtc).

## Media-over-QUIC

Start the server and open the web page:

```
https://localhost:8892/mystream/publish
```

The resulting stream will be available on path `/mystream`.

This web page can be embedded into another web page by using an iframe:

```
<iframe src="https://mediamtx-ip:8892/mystream/publish" scrolling="no"></iframe>
```

## WebRTC

Start the server and open the web page:

```
http://localhost:8889/mystream/publish
```

The resulting stream will be available on path `/mystream`.

Be aware that not all browsers can publish tracks with any codec, check [Codec support in browsers](https://mediamtx.org/docs/features/webrtc-specific-features#codec-support-in-browsers).

This web page can be embedded into another web page by using an iframe:

```
<iframe src="http://mediamtx-ip:8889/mystream/publish" scrolling="no"></iframe>
```

For more advanced setups, you can create and serve a custom web page by starting from the [source code of the WebRTC publish page](https://github.com/bluenviron/mediamtx/blob/v1.21.3/internal/servers/webrtc/publish_index.html). In particular, there’s a ready-to-use, standalone JavaScript class for publishing streams with WebRTC, available in [publisher.js](https://github.com/bluenviron/mediamtx/blob/v1.21.3/internal/servers/webrtc/publisher.js).


---

<!-- source: https://mediamtx.org/docs/publish/ffmpeg -->

# FFmpeg

FFmpeg can publish a stream to the server by acting as a [RTSP client](https://mediamtx.org/docs/publish/rtsp), [RTMP client](https://mediamtx.org/docs/publish/rtmp), [SRT client](https://mediamtx.org/docs/publish/srt), [WebRTC client](https://mediamtx.org/docs/publish/webrtc) or by sending [MPEG-TS packets](https://mediamtx.org/docs/static-sources/mpeg-ts) or [RTP packets](https://mediamtx.org/docs/static-sources/rtp). The recommended way is acting as a RTSP client.

## FFmpeg as a RTSP client

```
ffmpeg -re -stream_loop -1 -i file.mp4 -c copy -f rtsp rtsp://localhost:8554/mystream
```

## FFmpeg as a RTMP client

```
ffmpeg -re -stream_loop -1 -i file.mp4 -c copy -f flv rtmp://localhost:1935/mystream
```

## FFmpeg as a SRT client

```
ffmpeg -re -stream_loop -1 -i file.mp4 -c copy -f mpegts 'srt://localhost:8890?streamid=publish:stream&pkt_size=1316'
```

## FFmpeg as a WebRTC client

```
ffmpeg -re -f lavfi -i testsrc=size=1280x720:rate=30 \
-f lavfi -i "sine=frequency=1000:sample_rate=48000" \
-c:v libx264 -pix_fmt yuv420p -preset ultrafast -b:v 600k \
-c:a libopus -ar 48000 -ac 2 -b:a 128k \
-f whip http://localhost:8889/stream/whip
```

WARNING: in case of FFmpeg 8.0, a video track and an audio track must both be present.

## FFmpeg and MPEG-TS over UDP

In *MediaMTX* configuration, add a path with `source: udp+mpegts://238.0.0.1:1234`. Then:

```
ffmpeg -re -stream_loop -1 -i file.mp4 -c copy -f mpegts 'udp://238.0.0.1:1234?pkt_size=1316'
```

## FFmpeg and MPEG-TS over Unix socket

In *MediaMTX* configuration, add a path with `source: unix+mpegts:///tmp/socket.sock`. Then:

```
ffmpeg -re -f lavfi -i testsrc=size=1280x720:rate=30 \
-c:v libx264 -pix_fmt yuv420p -preset ultrafast -b:v 600k \
-f mpegts unix:/tmp/socket.sock
```

## FFmpeg and RTP over UDP

In *MediaMTX* configuration, add a path with `source: udp+rtp://238.0.0.1:1234` and a valid `rtpSDP` (read [RTP](https://mediamtx.org/docs/static-sources/rtp)). Then:

```
ffmpeg -re -f lavfi -i testsrc=size=1280x720:rate=30 \
-c:v libx264 -pix_fmt yuv420p -preset ultrafast -b:v 600k \
-f rtp udp://238.0.0.1:1234?pkt_size=1316
```


---

<!-- source: https://mediamtx.org/docs/publish/gstreamer -->

# GStreamer

GStreamer can publish a stream to the server by acting as a [RTSP client](https://mediamtx.org/docs/publish/rtsp), [RTMP client](https://mediamtx.org/docs/publish/rtmp), [SRT client](https://mediamtx.org/docs/publish/srt), [WebRTC client](https://mediamtx.org/docs/publish/webrtc) or by sending [MPEG-TS packets](https://mediamtx.org/docs/static-sources/mpeg-ts) or [RTP packets](https://mediamtx.org/docs/static-sources/rtp). The recommended way is acting as a RTSP client.

## GStreamer as a RTSP client

```
gst-launch-1.0 rtspclientsink name=s location=rtsp://localhost:8554/mystream \
filesrc location=file.mp4 ! qtdemux name=d \
d.video_0 ! queue ! s.sink_0 \
d.audio_0 ! queue ! s.sink_1
```

If the stream is video only:

```
gst-launch-1.0 filesrc location=file.mp4 ! qtdemux name=d \
d.video_0 ! rtspclientsink location=rtsp://localhost:8554/mystream
```

## GStreamer as a RTMP client

```
gst-launch-1.0 -v flvmux name=mux ! rtmpsink location=rtmp://localhost/stream \
videotestsrc ! video/x-raw,width=1280,height=720,format=I420 ! x264enc speed-preset=ultrafast bitrate=3000 key-int-max=60 ! video/x-h264,profile=high ! mux. \
audiotestsrc ! audioconvert ! avenc_aac ! mux.
```

## GStreamer as a SRT client

```
gst-launch-1.0 -v mpegtsmux name=mux ! srtsink uri="srt://localhost:8890?streamid=publish:mystream&pkt_size=1316" \
videotestsrc ! video/x-raw,width=1280,height=720,format=I420 ! x264enc speed-preset=ultrafast bitrate=3000 key-int-max=60 ! video/x-h264,profile=high ! mux. \
audiotestsrc ! audioconvert ! avenc_aac ! mux.
```

## GStreamer as a WebRTC client

Make sure that GStreamer version is at least 1.22, and that if the codec is H264, the profile is baseline. Use the `whipclientsink` element:

```
gst-launch-1.0 videotestsrc \
! video/x-raw,width=1920,height=1080,format=I420 \
! x264enc speed-preset=ultrafast bitrate=2000 \
! video/x-h264,profile=baseline \
! whipclientsink signaller::whip-endpoint=http://localhost:8889/mystream/whip
```

## GStreamer and MPEG-TS over UDP

In *MediaMTX* configuration, add a path with `source: unix+mpegts:///tmp/socket.sock`. Then:

```
gst-launch-1.0 -v mpegtsmux name=mux alignment=1 ! udpsink host=238.0.0.1 port=1234 \
videotestsrc ! video/x-raw,width=1280,height=720,format=I420 ! x264enc speed-preset=ultrafast bitrate=3000 key-int-max=60 ! video/x-h264,profile=high ! mux. \
audiotestsrc ! audioconvert ! avenc_aac ! mux.
```

## GStreamer and RTP over UDP

In *MediaMTX* configuration, add a path with `source: udp+rtp://238.0.0.1:1234` and a valid `rtpSDP` (read [RTP](https://mediamtx.org/docs/static-sources/rtp)). Then:

```
gst-launch-1.0 -v \
videotestsrc ! video/x-raw,width=1280,height=720,format=I420 ! x264enc speed-preset=ultrafast bitrate=3000 key-int-max=60 ! video/x-h264,profile=high ! rtph264pay config-interval=1 ! udpsink host=238.0.0.1 port=1234 \
audiotestsrc ! audioconvert ! avenc_aac ! rtpmp4gpay ! udpsink host=238.0.0.1 port=1236
```


---

<!-- source: https://mediamtx.org/docs/publish/obs-studio -->

# OBS Studio

OBS Studio can publish streams to the server by acting as a [RTMP client](https://mediamtx.org/docs/publish/rtmp) or a [WebRTC client](https://mediamtx.org/docs/publish/webrtc). The recommended way is acting as a RTMP client.

## OBS Studio as a RTMP client

### Standard

In `Settings -> Stream` (or in the Auto-configuration Wizard), use the following parameters:

- Service: `Custom...`
- Server: `rtmp://localhost/mystream`
- Stream key: (empty)

Save the configuration and click `Start streaming`.

The resulting stream will be available on path `/mystream`.

If you want to generate a stream that can be read with WebRTC, open `Settings -> Output -> Recording` and use the following parameters:

- FFmpeg output type: `Output to URL`
- File path or URL: `rtsp://localhost:8554/mystream`
- Container format: `rtsp`
- Check `show all codecs (even if potentially incompatible)`
- Video encoder: `h264_nvenc (libx264)`
- Video encoder settings (if any): `bf=0`
- Audio track: `1`
- Audio encoder: `libopus`

Then use the button `Start Recording` (instead of `Start Streaming`) to start streaming.

### Multitrack video

OBS Studio can publish multiple video tracks or renditions at once (simulcast). Make sure that the OBS Studio version is ≥ 31.0.0. Open `Settings -> Stream` and use the following parameters:

- Service: `Custom...`
- Server: `rtmp://localhost/mystream`
- Stream key: (empty)
- Turn on `Enable Multitrack Video`
- Leave `Maximum Streaming Bandwidth` and `Maximum Video Tracks` to `Auto`
- Turn on `Enable Config Override`
- Fill `Config Override (JSON)` with the following text:`{  "encoder_configurations": [  {  "type": "obs_x264",  "width": 1920,  "height": 1080,  "framerate": {  "numerator": 30,  "denominator": 1  },  "settings": {  "rate_control": "CBR",  "bitrate": 6000,  "keyint_sec": 2,  "preset": "veryfast",  "profile": "high",  "tune": "zerolatency"  },  "canvas_index": 0  },  {  "type": "obs_x264",  "width": 640,  "height": 480,  "framerate": {  "numerator": 30,  "denominator": 1  },  "settings": {  "rate_control": "CBR",  "bitrate": 3000,  "keyint_sec": 2,  "preset": "veryfast",  "profile": "main",  "tune": "zerolatency"  },  "canvas_index": 0  }  ],  "audio_configurations": {  "live": [  {  "codec": "ffmpeg_aac",  "track_id": 1,  "channels": 2,  "settings": {  "bitrate": 160  }  }  ]  } }`This can be adjusted according to specific needs. In particular, the `type` field is used to set the video encoder, and these are the available parameters:
  - `obs_nvenc_av1_tex`: NVIDIA NVENC AV1
  - `obs_nvenc_hevc_tex`: NVIDIA NVENC H265
  - `obs_nvenc_h264_tex`: NVIDIA NVENC H264
  - `av1_texture_amf`: AMD AV1
  - `h265_texture_amf`: AMD H265
  - `h264_texture_amf`: AMD H264
  - `obs_qsv11_av1`: QuickSync AV1
  - `obs_qsv11_v2`: QuickSync H264
  - `obs_x264`: software H264

Save the configuration and click `Start streaming`.

The resulting stream will be available on path `/mystream`.

### Encryption (RTMPS)

When publishing streams to *MediaMTX* with RTMP, you can encrypt streams in transit by using the encrypted variant of RTMP (RTMPS). This can be enabled by using the `rtmps` scheme and the 1936 port:

```
rtmps://localhost:1936/mystream
```

Make sure that RTMP encryption is allowed in *MediaMTX* (`rtmpEncryption: "optional"`).

OBS Studio requires *MediaMTX* to use a TLS certificate signed by a public certificate authority and silently rejects self-signed certificates. You can either buy a certificate from a public certificate authority or create a local certificate authority and use it to generate the server certificate and validate it on the OBS Studio machine, by following these instructions:

1. Create the key pair of the local certificate authority:`openssl req \ -x509 \ -nodes \ -days 3650 \ -newkey rsa:4096 \ -keyout myca.key \ -out myca.crt \ -subj "/O=myca/CN=myca"`
2. Use the key pair to create the server certificate. Replace `localhost` with the domain name OBS Studio will use to connect to the server:`openssl req \ -newkey rsa:4096 \ -nodes \ -keyout server.key \ -CA myca.crt \ -CAkey myca.key \ -subj "/CN=localhost" \ -x509 \ -days 3650 \ -out server.crt`You must use a domain name to connect to the server, not an IP address. If you do not have a domain name, edit the `/etc/hosts` file of the OBS Studio machine and associate a dummy domain name to the IP address of the server.
3. Put the newly-generated `server.key` and `server.cert` on the *MediaMTX* machine, in the same folder of the *MediaMTX* executable, and check that the configuration points to them.
4. Install the public key (`ca.crt`) of the local certificate authority on the OBS Studio machine.If you are using Linux, this can be accomplished with these commands:`sudo mkdir -p /usr/local/share/ca-certificates sudo cp myca.crt /usr/local/share/ca-certificates/ sudo update-ca-certificates`WARNING: this will still not work when OBS Studio is installed with Flatpak, since Flatpak isolates OBS Studio from the host and prevents it from reading the `ca-certificates` folder. Install OBS Studio through another mean (snap / ppa / .deb).If you are using Windows, this can be accomplished with the command:`certutil -addstore "Root" myca.crt`

## OBS Studio as a WebRTC client

### Standard

Recent versions of OBS Studio can also publish streams to the server with the [WebRTC / WHIP protocol](https://mediamtx.org/docs/publish/webrtc) Use the following parameters:

- Service: `WHIP`
- Server: `http://localhost:8889/mystream/whip`

Save the configuration and click `Start streaming`.

The resulting stream will be available on path `/mystream`.

### Multitrack video

OBS Studio can publish multiple video tracks or renditions at once (simulcast) with WebRTC / WHIP too. Make sure that the OBS Studio version is ≥ 32.1.0. Open `Settings -> Stream` and use the following parameters:

- Service: `WHIP`
- Server: `http://localhost:8889/mystream/whip`
- Simulcast, Total Layers: `2` (or greater)

Currently it’s not possible to change resolution or bitrate (or canvas) of renditions, since quality of secondary renditions is hardcoded as a percentage of the main one. You can find details on the [OBS documentation](https://obsproject.com/kb/whip-streaming-guide).

Save the configuration and click `Start streaming`.

The resulting stream will be available on path `/mystream`.

### Encryption

When publishing streams to *MediaMTX* with WebRTC, you can encrypt the WebRTC handshake by using the HTTPS-based variant of WHIP. This can be enabled by using the `https` scheme:

```
https://localhost:8889/mystream
```

Make sure that WebRTC encryption is enabled in *MediaMTX* (`webrtcEncryption: true`).

OBS Studio requires *MediaMTX* to use a TLS certificate signed by a public certificate authority and silently rejects self-signed certificates. You can either buy a certificate from a public certificate authority or create a local certificate authority and use it to generate the server certificate and validate it on the OBS Studio machine. Instructions are reported in OBS Studio and RTMP, encryption (RTMPS).


---

<!-- source: https://mediamtx.org/docs/publish/python-opencv -->

# Python and OpenCV

Python-based software can publish streams to the server with the OpenCV library and its GStreamer plugin, acting as a [RTSP client](https://mediamtx.org/docs/publish/rtsp). OpenCV must be compiled with support for GStreamer, by following this procedure:

```
sudo apt install -y libgstreamer1.0-dev libgstreamer-plugins-base1.0-dev gstreamer1.0-plugins-ugly gstreamer1.0-rtsp python3-dev python3-numpy
git clone --depth=1 -b 4.5.4 https://github.com/opencv/opencv
cd opencv
mkdir build && cd build
cmake -D CMAKE_INSTALL_PREFIX=/usr -D WITH_GSTREAMER=ON ..
make -j$(nproc)
sudo make install
```

You can check that OpenCV has been installed correctly by running:

```
python3 -c 'import cv2; print(cv2.getBuildInformation())'
```

Check that the output contains `GStreamer: YES`.

Videos can then be published with `cv2.VideoWriter`:

```
from datetime import datetime
from time import sleep, time

import cv2
import numpy as np

fps = 15
width = 800
height = 600
colors = [
    (0, 0, 255),
    (255, 0, 0),
    (0, 255, 0),
]

out = cv2.VideoWriter('appsrc ! videoconvert' + \
    ' ! video/x-raw,format=I420' + \
    ' ! x264enc speed-preset=ultrafast bitrate=600 key-int-max=' + str(fps * 2) + \
    ' ! video/x-h264,profile=baseline' + \
    ' ! rtspclientsink location=rtsp://localhost:8554/mystream',
    cv2.CAP_GSTREAMER, 0, fps, (width, height), True)
if not out.isOpened():
    raise Exception("can't open video writer")

curcolor = 0
start = time()

while True:
    frame = np.zeros((height, width, 3), np.uint8)

    # create a rectangle
    color = colors[curcolor]
    curcolor += 1
    curcolor %= len(colors)
    for y in range(0, int(frame.shape[0] / 2)):
        for x in range(0, int(frame.shape[1] / 2)):
            frame[y][x] = color

    out.write(frame)
    print("%s frame written to the server" % datetime.now())

    now = time()
    diff = (1 / fps) - now - start
    if diff > 0:
        sleep(diff)
    start = now
```

The resulting stream will be available on path `/mystream`.


---

<!-- source: https://mediamtx.org/docs/publish/golang -->

# Golang

You can publish a stream to the server by using the Go programming language and the following libraries:

- [gortsplib](https://github.com/bluenviron/gortsplib) to publish with RTSP.
- [gortmplib](https://github.com/bluenviron/gortmplib) to publish with RTMP.
- [gosrt](https://github.com/datarhei/gosrt) to publish with SRT.

All these power *MediaMTX* itself. In the repositories of these projects there are several examples on how to connect to a server and push data.


---

<!-- source: https://mediamtx.org/docs/publish/unity -->

# Unity

Software written with the Unity Engine can publish a stream to the server by acting as a [WebRTC client](https://mediamtx.org/docs/publish/webrtc).

Create a new Unity project or open an existing one.

Open *Window -> Package Manager*, click on the plus sign, *Add Package by name…* and insert `com.unity.webrtc`. Wait for the package to be installed.

In the *Project* window, under `Assets`, create a new C# Script called `WebRTCPublisher.cs` with this content:

```
using System.Collections;
using UnityEngine;
using Unity.WebRTC;
using UnityEngine.Networking;

public class WebRTCPublisher : MonoBehaviour
{
    public string url = "http://localhost:8889/unity/whip";
    public int videoWidth = 1280;
    public int videoHeight = 720;

    private RTCPeerConnection pc;
    private MediaStream videoStream;

    void Start()
    {
        pc = new RTCPeerConnection();
        Camera sourceCamera = gameObject.GetComponent<Camera>();
        videoStream = sourceCamera.CaptureStream(videoWidth, videoHeight);
        foreach (var track in videoStream.GetTracks())
        {
            pc.AddTrack(track);
        }

        StartCoroutine(WebRTC.Update());
        StartCoroutine(createOffer());
    }

    private IEnumerator createOffer()
    {
        var op = pc.CreateOffer();
        yield return op;
        if (op.IsError) {
            Debug.LogError("CreateOffer() failed");
            yield break;
        }

        yield return setLocalDescription(op.Desc);
    }

    private IEnumerator setLocalDescription(RTCSessionDescription offer)
    {
        var op = pc.SetLocalDescription(ref offer);
        yield return op;
        if (op.IsError) {
            Debug.LogError("SetLocalDescription() failed");
            yield break;
        }

        yield return postOffer(offer);
    }

    private IEnumerator postOffer(RTCSessionDescription offer)
    {
        var content = new System.Net.Http.StringContent(offer.sdp);
        content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("application/sdp");
        var client = new System.Net.Http.HttpClient();

        var task = System.Threading.Tasks.Task.Run(async () => {
            var res = await client.PostAsync(new System.UriBuilder(url).Uri, content);
            res.EnsureSuccessStatusCode();
            return await res.Content.ReadAsStringAsync();
        });
        yield return new WaitUntil(() => task.IsCompleted);
        if (task.Exception != null) {
            Debug.LogError(task.Exception);
            yield break;
        }

        yield return setRemoteDescription(task.Result);
    }

    private IEnumerator setRemoteDescription(string answer)
    {
        RTCSessionDescription desc = new RTCSessionDescription();
        desc.type = RTCSdpType.Answer;
        desc.sdp = answer;
        var op = pc.SetRemoteDescription(ref desc);
        yield return op;
        if (op.IsError) {
            Debug.LogError("SetRemoteDescription() failed");
            yield break;
        }

        yield break;
    }

    void OnDestroy()
    {
        pc?.Close();
        pc?.Dispose();
        videoStream?.Dispose();
    }
}
```

In the *Hierarchy* window, find or create a scene and a camera, then add the `WebRTCPublisher.cs` script as component of the camera, by dragging it inside the *Inspector* window. then Press the *Play* button at the top of the page.

The resulting stream will be available on path `/unity`.


---

<!-- source: https://mediamtx.org/docs/static-sources/moq -->

# Media-over-QUIC servers

|  | supported codecs |
|---|---|
| **video** | AV1, VP9, VP8, H265, H264 |
| **audio** | Opus, MPEG-4 Audio (AAC) |

In order to ingest a Media-over-QUIC stream from a remote server, add the corresponding URL into the `source` parameter of a path:

```
paths:
  proxied:
    source: moqt://user:pass@host:port/path
    # Transport protocol used to pull the stream. available values are "quic", "webtransport".
    moqTransport: quic
```

If username or password contain special characters (like ?, :, etc), they need to be [url-encoded](https://www.urlencoder.org/).

If host is a stateless IPv6 address, wrap the address in square brackets and write the zone separator `%` as `%25`, for example `moqt://[fe80::1234:5678:9abc:def0%25eth0]:8892/path`.


---

<!-- source: https://mediamtx.org/docs/static-sources/srt -->

# SRT cameras and servers

|  | supported codecs |
|---|---|
| **video** | H265, H264, MPEG-4 Video (H263, Xvid), MPEG-1/2 Video |
| **audio** | Opus, MPEG-4 Audio (AAC), MPEG-1/2 Audio (MP3), AC-3 |
| **other** | KLV |

In order to ingest a SRT stream from a remote server, camera or client in listening mode (i.e. with `mode=listener` appended to the URL), add the corresponding URL into the `source` parameter of a path:

```
paths:
  proxied:
    source: srt://host:port?streamid=streamid
```


---

<!-- source: https://mediamtx.org/docs/static-sources/webrtc -->

# WebRTC servers

|  | supported codecs |
|---|---|
| **video** | AV1, VP9, VP8, H265, H264 |
| **audio** | Opus, G722, G711 (PCMA, PCMU) |

In order to ingest a WebRTC stream from a remote server, add the corresponding WHEP URL into the `source` parameter of a path:

```
paths:
  proxied:
    # Use whep:// for HTTP and wheps:// for HTTPS.
    source: whep://host:port/path
    # If the source is HTTPS and the source TLS certificate is self-signed
    # or invalid, you can provide the fingerprint of the certificate in order to
    # validate it anyway. It can be obtained by running:
    # openssl s_client -connect source_ip:source_port </dev/null 2>/dev/null | sed -n '/BEGIN/,/END/p' > server.crt
    # openssl x509 -in server.crt -noout -fingerprint -sha256 | cut -d "=" -f2 | tr -d ':'
    sourceFingerprint:
    # Token to insert in the Authorization: Bearer header.
    whepBearerToken: ""
```

If host is a stateless IPv6 address, wrap the address in square brackets and write the zone separator `%` as `%25`, for example `whep://[fe80::1234:5678:9abc:def0%25eth0]:8889/path`.

If the remote server is a *MediaMTX* instance, remember to add a `/whep` suffix after the stream name, since in *MediaMTX* [it’s part of the WHEP URL](https://mediamtx.org/docs/read/webrtc):

```
paths:
  proxied:
    source: whep://host:port/mystream/whep
```


---

<!-- source: https://mediamtx.org/docs/static-sources/rtsp -->

# RTSP cameras and servers

|  | supported codecs |
|---|---|
| **video** | AV1, VP9, VP8, H265, H264, MPEG-4 Video (H263, Xvid), MPEG-1/2 Video, MJPEG |
| **audio** | Opus, MPEG-4 Audio (AAC), MPEG-1/2 Audio (MP3), AC-3, G726, G722, G711 (PCMA, PCMU), LPCM |
| **other** | KLV, MPEG-TS, any RTP-compatible codec |

Most IP cameras expose their video stream by using a RTSP server that is embedded into the camera itself. In particular, cameras that are compliant with ONVIF profile S or T meet this requirement. You can use *MediaMTX* to connect to one or several existing RTSP servers and read their media streams:

```
paths:
  proxied:
    # Use rtsp:// for plain RTSP and rtsps:// for encrypted RTSP.
    source: rtsp://user:pass@host:port/path
    # If the source is RTSPS and the source TLS certificate is self-signed
    # or invalid, you can provide the fingerprint of the certificate in order to
    # validate it anyway. It can be obtained by running:
    # openssl s_client -connect source_ip:source_port </dev/null 2>/dev/null | sed -n '/BEGIN/,/END/p' > server.crt
    # openssl x509 -in server.crt -noout -fingerprint -sha256 | cut -d "=" -f2 | tr -d ':'
    sourceFingerprint:
```

If username or password contain special characters (like ?, :, etc), they need to be [url-encoded](https://www.urlencoder.org/).

If host is a stateless IPv6 address, wrap the address in square brackets and write the zone separator `%` as `%25`, for example `rtsp://[fe80::1234:5678:9abc:def0%25eth0]:554/path`.

Some cameras require a username but an empty password. In this case, keep the colon after the username (`rtsp://user:@host:port/path`): a username without a colon (`rtsp://user@host:port/path`) is treated as a missing password and rejected.

The resulting stream will be available on path `/proxied`.

It is possible to tune the connection by using several additional parameters, that are listed in the [configuration file](https://mediamtx.org/docs/references/configuration-file).

Advanced RTSP features and settings are described in [RTSP-specific features](https://mediamtx.org/docs/features/rtsp-specific-features).

## MPEG-TS inside RTSP

Some RTSP servers expose a single MPEG-TS (MP2T) track instead of elementary H.264 / H.265. In that case MediaMTX would keep `tracks: ["MPEG-TS"]` and HLS / WebRTC would not attach. Enable `rtspDemuxMpegts` on the path (same flag as RTSP publishers):

```
paths:
  proxied:
    source: rtsp://user:pass@host:port/path
    rtspTransport: tcp
    rtspDemuxMpegts: true
```


---

<!-- source: https://mediamtx.org/docs/static-sources/rtmp -->

# RTMP cameras and servers

|  | supported codecs |
|---|---|
| **video** | AV1, VP9, H265, H264 |
| **audio** | Opus, FLAC, MPEG-4 Audio (AAC), MPEG-1/2 Audio (MP3), AC-3, G711 (PCMA, PCMU), LPCM |

You can use *MediaMTX* to connect to one or several existing RTMP servers and read their media streams:

```
paths:
  proxied:
    # Use rtmp:// for plain RTMP and rtmps:// for encrypted RTMP.
    source: rtmp://user:pass@host:port/path#streamKey
    # If the source is RTMPS and the source TLS certificate is self-signed
    # or invalid, you can provide the fingerprint of the certificate in order to
    # validate it anyway. It can be obtained by running:
    # openssl s_client -connect source_ip:source_port </dev/null 2>/dev/null | sed -n '/BEGIN/,/END/p' > server.crt
    # openssl x509 -in server.crt -noout -fingerprint -sha256 | cut -d "=" -f2 | tr -d ':'
    sourceFingerprint:
```

If username or password contain special characters (like ?, :, etc), they need to be [url-encoded](https://www.urlencoder.org/).

If host is a stateless IPv6 address, wrap the address in square brackets and write the zone separator `%` as `%25`, for example `rtmp://[fe80::1234:5678:9abc:def0%25eth0]:1935/path`.

The resulting stream will be available on path `/proxied`.


---

<!-- source: https://mediamtx.org/docs/static-sources/hls -->

# HLS cameras and servers

|  | supported codecs |
|---|---|
| **video** | AV1, VP9, H265, H264 |
| **audio** | Opus, FLAC, MPEG-4 Audio (AAC) |
| **other** | KLV (MPEG-TS-based HLS only) |

HLS is a streaming protocol that works by splitting streams into segments, and by serving these segments and a playlist with the HTTP protocol. You can use *MediaMTX* to connect to one or several existing HLS servers and read their media streams:

```
paths:
  proxied:
    # Use http:// for plain HTTP and https:// for HTTPS.
    source: http://user:pass@host:port/path
    # If the source is HTTPS and the source TLS certificate is self-signed
    # or invalid, you can provide the fingerprint of the certificate in order to
    # validate it anyway. It can be obtained by running:
    # openssl s_client -connect source_ip:source_port </dev/null 2>/dev/null | sed -n '/BEGIN/,/END/p' > server.crt
    # openssl x509 -in server.crt -noout -fingerprint -sha256 | cut -d "=" -f2 | tr -d ':'
    sourceFingerprint:
```

If username or password contain special characters (like ?, :, etc), they need to be [url-encoded](https://www.urlencoder.org/).

If host is a stateless IPv6 address, wrap the address in square brackets and write the zone separator `%` as `%25`, for example `http://[fe80::1234:5678:9abc:def0%25eth0]:8080/path`.

The resulting stream will be available on path `/proxied`.


---

<!-- source: https://mediamtx.org/docs/static-sources/mpeg-ts -->

# MPEG-TS

|  | supported codecs |
|---|---|
| **video** | H265, H264, MPEG-4 Video (H263, Xvid), MPEG-1/2 Video |
| **audio** | Opus, MPEG-4 Audio (AAC), MPEG-1/2 Audio (MP3), AC-3 |
| **other** | KLV |

The server supports ingesting MPEG-TS streams, shipped in two different ways (UDP packets or Unix sockets).

In order to read a UDP MPEG-TS stream, edit `mediamtx.yml` and replace everything inside section `paths` with the following content:

```
paths:
  mypath:
    source: udp+mpegts://ip:port
```

The IP is usually a multicast IP, for instance:

```
paths:
  mypath:
    source: udp+mpegts://238.0.0.1:1234
```

If the listening IP is a multicast IP, *MediaMTX* will listen for incoming packets on the default multicast interface, picked by the operating system. It is possible to specify the interface manually by using the `interface` parameter:

```
paths:
  mypath:
    source: udp+mpegts://238.0.0.1:1234?interface=eth0
```

To listen on every multicast-capable interface, set the `interface` parameter to `all`:

```
paths:
  mypath:
    source: udp+mpegts://238.0.0.1:1234?interface=all
```

It is possible to restrict who can send packets by using the `source` parameter:

```
paths:
  mypath:
    source: udp+mpegts://0.0.0.0:1234?source=192.168.3.5
```

Some clients that can publish with UDP and MPEG-TS are [FFmpeg](https://mediamtx.org/docs/publish/ffmpeg) and [GStreamer](https://mediamtx.org/docs/publish/gstreamer).

Unix sockets are more efficient than UDP packets and can be used as transport by specifying the `unix+mpegts` scheme:

```
paths:
  mypath:
    source: unix+mpegts:///tmp/socket.sock
```


---

<!-- source: https://mediamtx.org/docs/static-sources/rtp -->

# RTP

|  | supported codecs |
|---|---|
| **video** | AV1, VP9, VP8, H265, H264, MPEG-4 Video (H263, Xvid), MPEG-1/2 Video, M-JPEG |
| **audio** | Opus, MPEG-4 Audio (AAC), MPEG-1/2 Audio (MP3), AC-3, G726, G722, G711 (PCMA, PCMU), LPCM |
| **other** | KLV, MPEG-TS, any RTP-compatible codec |

The server supports ingesting RTP streams, transmitted with UDP packets.

In order to read a UDP RTP stream, edit `mediamtx.yml` and replace everything inside section `paths` with the following content:

```
paths:
  mypath:
    source: udp+rtp://238.0.0.1:1234
    rtpSDP: |
      v=0
      o=- 123456789 123456789 IN IP4 192.168.1.100
      s=H264 Video Stream
      c=IN IP4 192.168.1.100
      t=0 0
      m=video 5004 RTP/AVP 96
      a=rtpmap:96 H264/90000
```

`rtpSDP` must contain a valid SDP, that is a description of the RTP session.

If the listening IP is a multicast IP, MediaMTX will listen for incoming packets on the default multicast interface, picked by the operating system. It is possible to specify the interface manually by using the interface parameter:

```
paths:
  mypath:
    source: udp+rtp://238.0.0.1:1234?interface=eth0
    rtpSDP: |
      v=0
      o=- 123456789 123456789 IN IP4 192.168.1.100
      s=H264 Video Stream
      c=IN IP4 192.168.1.100
      t=0 0
      m=video 5004 RTP/AVP 96
      a=rtpmap:96 H264/90000
```

To listen on every multicast-capable interface, set the `interface` parameter to `all`.

```
paths:
  mypath:
    source: udp+rtp://238.0.0.1:1234?interface=all
    rtpSDP: |
      v=0
      o=- 123456789 123456789 IN IP4 192.168.1.100
      s=H264 Video Stream
      c=IN IP4 192.168.1.100
      t=0 0
      m=video 5004 RTP/AVP 96
      a=rtpmap:96 H264/90000
```

It is possible to restrict who can send packets by using the source parameter:

```
paths:
  mypath:
    source: udp+rtp://238.0.0.1:1234?source=192.168.3.5
    rtpSDP: |
      v=0
      o=- 123456789 123456789 IN IP4 192.168.1.100
      s=H264 Video Stream
      c=IN IP4 192.168.1.100
      t=0 0
      m=video 5004 RTP/AVP 96
      a=rtpmap:96 H264/90000
```

Some clients that can publish with UDP and MPEG-TS are [FFmpeg](https://mediamtx.org/docs/publish/ffmpeg) and [GStreamer](https://mediamtx.org/docs/publish/gstreamer).


---

<!-- source: https://mediamtx.org/docs/static-sources/raspberry-pi-cameras -->

# Raspberry Pi Cameras

*MediaMTX* natively supports most Raspberry Pi Camera models, enabling high-quality and low-latency video streaming from the camera to any user, for any purpose.

The server must run on a Raspberry Pi, with one of the following operating systems:

- Raspberry Pi OS Trixie
- Raspberry Pi OS Bookworm

Both 32-bit and 64-bit architectures are supported.

The setup procedure depends on whether you want to run the server outside or inside Docker:

- If you want to run the standard (non-Dockerized) version of the server:`paths:  cam:  source: rpiCamera`The resulting stream will be available on path `/cam`.
  1. Download the server executable. If you’re using 64-bit version of the operative system, make sure to pick the `arm64` variant.
  2. Edit `mediamtx.yml` and replace everything inside section `paths` with the following content:
- If you want to run the server inside Docker, you need to use the `1-rpi` image and launch the container with some additional flags:`docker run --rm -it \ --network=host \ --privileged \ --tmpfs /dev/shm:exec \ -v /run/udev:/run/udev:ro \ -e MTX_PATHS_CAM_SOURCE=rpiCamera \ bluenviron/mediamtx:1-rpi`

The Raspberry Pi Camera can be controlled through a wide range of parameters, that are listed in the [configuration file](https://mediamtx.org/docs/references/configuration-file).

## Custom libcamera

Some cameras, in particular ArduCam products, require a custom `libcamera`. These are not compatible with precompiled *MediaMTX* binaries and Docker images, since they embed a standard `libcamera`.

If you want to interact with these cameras, you need to [compile MediaMTX from source](https://mediamtx.org/docs/misc/compile#custom-libcamera).

## Adding audio

In order to add audio from a USB microphone, install GStreamer and alsa-utils:

```
sudo apt install -y gstreamer1.0-tools gstreamer1.0-rtsp gstreamer1.0-alsa alsa-utils
```

list available audio cards with:

```
arecord -L
```

Sample output:

```
surround51:CARD=ICH5,DEV=0
    Intel ICH5, Intel ICH5
    5.1 Surround output to Front, Center, Rear and Subwoofer speakers
default:CARD=U0x46d0x809
    USB Device 0x46d:0x809, USB Audio
    Default Audio Device
```

Find the audio card of the microphone and take note of its name, for instance `default:CARD=U0x46d0x809`. Then create a new path that takes the video stream from the camera and audio from the microphone:

```
paths:
  cam:
    source: rpiCamera

  cam_with_audio:
    runOnInit: >
      gst-launch-1.0
      rtspclientsink name=s location=rtsp://localhost:$RTSP_PORT/cam_with_audio
      rtspsrc location=rtsp://127.0.0.1:$RTSP_PORT/cam latency=0 ! rtph264depay ! s.
      alsasrc device=default:CARD=U0x46d0x809 ! opusenc bitrate=16000 ! s.
    runOnInitRestart: yes
```

The resulting stream will be available on path `/cam_with_audio`.

## Secondary stream

It is possible to enable a secondary stream from the same camera, with a different resolution, FPS and codec. Configuration is the same of a primary stream, with `rpiCameraSecondary` set to `true` and parameters adjusted accordingly:

```
paths:
  # primary stream
  rpi:
    source: rpiCamera
    # Width of frames.
    rpiCameraWidth: 1920
    # Height of frames.
    rpiCameraHeight: 1080
    # FPS.
    rpiCameraFPS: 30

  # secondary stream
  secondary:
    source: rpiCamera
    # This is a secondary stream.
    rpiCameraSecondary: true
    # Width of frames.
    rpiCameraWidth: 640
    # Height of frames.
    rpiCameraHeight: 480
    # FPS.
    rpiCameraFPS: 10
    # Codec. in case of secondary streams, it defaults to M-JPEG.
    rpiCameraCodec: auto
    # JPEG quality.
    rpiCameraMJPEGQuality: 60
```

The secondary stream will be available on path `/secondary`.

## Multiple cameras

It is possible to stream several cameras at once by using `rpiCameraCamID`:

```
paths:
  # first camera
  cam1:
    source: rpiCamera
    rpiCameraCamID: 0

  # second camera
  cam2:
    source: rpiCamera
    rpiCameraCamID: 1
```


---

<!-- source: https://mediamtx.org/docs/read/moq -->

# Media-over-QUIC clients

|  | supported codecs |
|---|---|
| **video** | AV1, VP9, VP8, H265, H264 |
| **audio** | Opus, FLAC, MPEG-4 Audio (AAC), G711 (PCMA, PCMU), LPCM |

Media-over-QUIC is a streaming protocol built upon cutting edge protocols (QUIC, HTTP3) and browser APIs (WebTransport, WebCodecs) that can be used to publish and read live media streams. It’s slightly faster than WebRTC, has an advanced data recovery mechanism, supports additional codecs (FLAC and future ones), supports B-frames and is less complicated to route.

There are some limitations and requirements that are listed in [Publish with Media-over-QUIC clients](https://mediamtx.org/docs/publish/moq).

You can read a stream with Media-over-QUIC and a web browser by visiting:

```
https://localhost:8892/mystream
```

You can also read with native QUIC clients by connecting directly to `moqQUICAddress` (default is `:8893`).


---

<!-- source: https://mediamtx.org/docs/read/srt -->

# SRT clients

|  | supported codecs |
|---|---|
| **video** | H265, H264, MPEG-4 Video (H263, Xvid), MPEG-1/2 Video |
| **audio** | Opus, MPEG-4 Audio (AAC), MPEG-1/2 Audio (MP3), AC-3 |
| **other** | KLV |

SRT is a protocol that allows to publish and read live data stream, providing encryption, integrity and a retransmission mechanism. It is usually used to transfer media streams encoded with MPEG-TS. In order to read a stream from the server with the SRT protocol, use this URL:

```
srt://localhost:8890?streamid=read:mystream
```

Replace `mystream` with the path name.

If you need to use the standard stream ID syntax instead of the custom one in use by this server, read [Standard stream ID syntax](https://mediamtx.org/docs/features/srt-specific-features#standard-stream-id-syntax).

Some clients that can read with SRT are [FFmpeg](https://mediamtx.org/docs/read/ffmpeg), [GStreamer](https://mediamtx.org/docs/read/gstreamer) and [VLC](https://mediamtx.org/docs/read/vlc).


---

<!-- source: https://mediamtx.org/docs/read/webrtc -->

# WebRTC clients

|  | supported codecs |
|---|---|
| **video** | AV1, VP9, VP8, H265, H264 |
| **audio** | Opus, G722, G711 (PCMA, PCMU) |
| **other** | KLV |

WebRTC is an API that makes use of a set of protocols and methods to connect two clients together and allow them to exchange live media or data streams. You can read a stream with WebRTC and a web browser by visiting:

```
http://localhost:8889/mystream
```

WHEP is a WebRTC extension that allows to read streams by using a URL, without passing through a web page. This allows to use WebRTC as a general purpose streaming protocol. If you are using a software that supports WHEP, you can read a stream from the server by using this URL:

```
http://localhost:8889/mystream/whep
```

Be aware that not all browsers can read tracks with any codec, check [Codec support in browsers](https://mediamtx.org/docs/features/webrtc-specific-features#codec-support-in-browsers).

Depending on the network it may be difficult to establish a connection between server and clients, read [Solving WebRTC connectivity issues](https://mediamtx.org/docs/features/webrtc-specific-features#solving-webrtc-connectivity-issues).

Some clients that can read with WebRTC and WHEP are [web browsers](https://mediamtx.org/docs/read/web-browsers), [GStreamer](https://mediamtx.org/docs/read/gstreamer) and [Unity](https://mediamtx.org/docs/read/unity).


---

<!-- source: https://mediamtx.org/docs/read/rtsp -->

# RTSP clients

|  | supported codecs |
|---|---|
| **video** | AV1, VP9, VP8, H265, H264, MPEG-4 Video (H263, Xvid), MPEG-1/2 Video, M-JPEG |
| **audio** | Opus, MPEG-4 Audio (AAC), MPEG-1/2 Audio (MP3), AC-3, G726, G722, G711 (PCMA, PCMU), LPCM |
| **other** | KLV, MPEG-TS, any RTP-compatible codec |

RTSP is a protocol that allows to publish and read streams. It supports several underlying transport protocols and encryption (read [RTSP-specific features](https://mediamtx.org/docs/features/rtsp-specific-features)). In order to read a stream with the RTSP protocol, use this URL:

```
rtsp://localhost:8554/mystream
```

Some clients that can read with RTSP are [FFmpeg](https://mediamtx.org/docs/read/ffmpeg), [GStreamer](https://mediamtx.org/docs/read/gstreamer) and [VLC](https://mediamtx.org/docs/read/vlc).


---

<!-- source: https://mediamtx.org/docs/read/rtmp -->

# RTMP clients

|  | supported codecs |
|---|---|
| **video** | AV1, VP9, H265, H264 |
| **audio** | Opus, FLAC, MPEG-4 Audio (AAC), MPEG-1/2 Audio (MP3), AC-3, G711 (PCMA, PCMU), LPCM |

RTMP is a protocol that allows to read and publish streams. It has been expanded to support modern codecs (Enhanced RTMP) and it supports encryption, read [RTMP-specific features](https://mediamtx.org/docs/features/rtmp-specific-features). Streams can be read from the server by using the URL:

```
rtmp://localhost/mystream
```

Some clients that can read with RTMP are [FFmpeg](https://mediamtx.org/docs/read/ffmpeg), [GStreamer](https://mediamtx.org/docs/read/gstreamer) and [VLC](https://mediamtx.org/docs/read/vlc).


---

<!-- source: https://mediamtx.org/docs/read/hls -->

# HLS

|  | supported codecs |
|---|---|
| **video** | AV1, VP9, H265, H264 |
| **audio** | Opus, FLAC, MPEG-4 Audio (AAC) |
| **other** | KLV (MPEG-TS-based HLS only) |

HLS is a protocol that works by splitting streams into segments, and by serving these segments and a playlist with the HTTP protocol. You can use *MediaMTX* to generate an HLS stream, that is accessible through a web page:

```
http://localhost:8888/mystream
```

and can also be accessed without using the browsers, by software that supports the HLS protocol (for instance VLC or *MediaMTX* itself) by using this URL:

```
http://localhost:8888/mystream/index.m3u8
```

Some clients that can read with HLS are [web browsers](https://mediamtx.org/docs/read/web-browsers), [FFmpeg](https://mediamtx.org/docs/read/ffmpeg), [GStreamer](https://mediamtx.org/docs/read/gstreamer) and [VLC](https://mediamtx.org/docs/read/vlc).

*MediaMTX* supports generating HLS in several variants (including Low-Latency mode), and provides various parameters to tune HLS generation. These are listed in the [configuration file](https://mediamtx.org/docs/references/configuration-file).

HLS can also be used to [scale the server](https://mediamtx.org/docs/features/scalability) through a CDN.


---

<!-- source: https://mediamtx.org/docs/read/web-browsers -->

# Web browsers

Web browsers can read a stream from the server with the [Media-over-QUIC](https://mediamtx.org/docs/read/moq), [WebRTC](https://mediamtx.org/docs/read/webrtc) and [HLS](https://mediamtx.org/docs/read/hls) protocols, by accessing web pages hosted by the server. It is also possible to embed streams into an external website.

## Direct read

### Media-over-QUIC

Visit the web page:

```
https://localhost:8892/mystream
```

Replace `mystream` with the path name.

### WebRTC

Visit the web page:

```
http://localhost:8889/mystream
```

Replace `mystream` with the path name.

Be aware that not all browsers can read tracks with any codec, check [Codec support in browsers](https://mediamtx.org/docs/features/webrtc-specific-features#codec-support-in-browsers).

### HLS

The HLS protocol has a higher latency with respect to WebRTC, but there are fewer problems related to connectivity between server and clients. Visit the web page:

```
http://localhost:8888/mystream
```

Replace `mystream` with the path name.

## Embed in a website

Live streams can be embedded into an external website by using the WebRTC or HLS protocol. Before embedding, check that the stream is ready and can be accessed with intended protocol by visiting web pages mentioned in the previous section.

### Media-over-QUIC in iframe

The simplest way to embed a live stream in a web page, using the Media-over-QUIC protocol, consists in adding an `<iframe>` tag to the body section of the HTML:

```
<iframe src="https://mediamtx-ip:8892/mystream" scrolling="no"></iframe>
```

### WebRTC in iframe

The simplest way to embed a live stream in a web page, using the WebRTC protocol, consists in adding an `<iframe>` tag to the body section of the HTML:

```
<iframe src="http://mediamtx-ip:8889/mystream" scrolling="no"></iframe>
```

The iframe can be controlled by adding query parameters to the URL (example: `http://mediamtx-ip:8889/mystream?muted=false`). The following parameters are available:

- `controls` (boolean): whether to show controls. Default is true.
- `muted` (boolean): whether to start the stream muted. Default is true.
- `autoplay` (boolean): whether to autoplay the stream. Default is true.
- `playsInline` (boolean): whether to play the stream without using the entire window of mobile devices. Default is true.
- `disablepictureinpicture` (boolean): whether to disable the ability to open the stream in a dedicated window. Default is false.

The iframe method is fit for most use cases, but it has some limitations:

- it doesn’t allow to pass credentials (username, password or token) from the website to *MediaMTX*; credentials are asked directly to users.
- it doesn’t allow to directly access the video tag, to extract data from it, or to perform dynamic actions.

### WebRTC with JavaScript

In order to overcome the limitations of the iframe-based method, it is possible to load the stream directly inside a `<video>` tag in the web page, through a JavaScript library.

Download [reader.js](https://github.com/bluenviron/mediamtx/blob/v1.21.3/internal/servers/webrtc/reader.js) from the repository and serve it together with the other assets of the website.

If you are using a JavaScript bundler, you can import it by using:

```
import "./reader.js";
```

Otherwise, you can add a `<script>` tag to the `<head>` section of the page:

```
<script defer src="./reader.js"></script>
```

Add a `<video>` tag:

```
<video
  id="myvideo"
  controls
  muted
  autoplay
  playsinline
  width="640"
  height="480"
></video>
```

After the video tag, add a script that initializes the stream when the page is fully loaded:

```
<script>
  let reader = null;

  window.addEventListener("load", () => {
    reader = new MediaMTXWebRTCReader({
      url: "http://mediamtx-ip:8889/mystream/whep",
      user: "", // fill if needed
      pass: "", // fill if needed
      token: "", // fill if needed
      onError: (err) => {
        console.error(err);
      },
      onTrack: (evt) => {
        document.getElementById("myvideo").srcObject = evt.streams[0];
      },
      onDataChannel: (evt) => {
        evt.channel.binaryType = "arraybuffer";
        evt.channel.onmessage = (evt) => {
          console.log("data channel message", evt.data);
        };
      },
    });
  });

  window.addEventListener("beforeunload", () => {
    if (reader !== null) {
      reader.close();
    }
  });
</script>
```

### HLS in iframe

Reading a stream with the HLS protocol introduces some latency, but is usually easier to setup since it doesn’t involve managing additional ports that in WebRTC are used to transmit the stream.

The simplest way to embed a live stream in a web page, using the HLS protocol, consists in adding an `<iframe>` tag to the body section of the HTML:

```
<iframe src="http://mediamtx-ip:8888/mystream" scrolling="no"></iframe>
```

The iframe can be controlled by adding query parameters to the URL (example: `http://mediamtx-ip:8888/mystream?muted=false`). The following parameters are available:

- `controls` (boolean): whether to show controls. Default is true.
- `muted` (boolean): whether to start the stream muted. Default is true.
- `autoplay` (boolean): whether to autoplay the stream. Default is true.
- `playsInline` (boolean): whether to play the stream without using the entire window of mobile devices. Default is true.
- `disablepictureinpicture` (boolean): whether to disable the ability to open the stream in a dedicated window. Default is false.

The iframe method is fit for most use cases, but it has some limitations:

- it doesn’t allow to pass credentials (username, password or token) from the website to *MediaMTX*; credentials are asked directly to users.
- it doesn’t allow to directly access the video tag, to extract data from it, or to perform dynamic actions.

### HLS with JavaScript

In order to overcome the limitations of the iframe-based method, it is possible to load the stream directly inside a `<video>` tag in the web page, through the *hls.js* library.

Be aware that *hls.js* is not compatible with browsers that do not expose the [Media Source Extensions API](https://caniuse.com/mediasource), in particular old iOS versions (iPad iOS `< 13`, iPhone iOS `< 17`).

If you are using a JavaScript bundler, you can import *hls.js* by adding [its npm package](https://www.npmjs.com/package/hls.js) as dependency and then importing it:

```
import Hls from "hls.js";
```

Otherwise, you can use a `<script>` tag inside the `<head>` section that points to a CDN:

```
<script defer src="https://cdn.jsdelivr.net/npm/hls.js@1"></script>
```

Add a `<video>` tag:

```
<video
  id="myvideo"
  controls
  muted
  autoplay
  playsinline
  width="640"
  height="480"
></video>
```

After the video tag, add a script that initializes the stream when the page is fully loaded:

```
<script>
  window.addEventListener("load", () => {
    const video = document.getElementById("myvideo");

    const hls = new Hls({
      xhrSetup: function (xhr, url) {
        let user = ""; // fill if needed
        let pass = ""; // fill if needed
        let token = ""; // fill if needed

        if (user !== "") {
          const credentials = btoa(`${user}:${pass}`);
          xhr.setRequestHeader("Authorization", `Basic ${credentials}`);
        } else if (token !== "") {
          xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        }
      },
    });

    hls.on(Hls.Events.MEDIA_ATTACHED, () => {
      hls.loadSource("http://mediamtx-ip:8888/mystream/index.m3u8");
    });

    // when the video is resumed after a manual or forced pause
    // (i.e. when the window is minimized), restore live streaming.
    video.onplay = () => {
      video.currentTime = hls.liveSyncPosition;
    };

    hls.attachMedia(video);
  });
</script>
```


---

<!-- source: https://mediamtx.org/docs/read/ffmpeg -->

# FFmpeg

FFmpeg can read a stream from the server the [RTSP](https://mediamtx.org/docs/read/rtsp), [RTMP](https://mediamtx.org/docs/read/rtmp), [HLS](https://mediamtx.org/docs/read/hls) and [SRT](https://mediamtx.org/docs/read/srt) protocols. The recommended one is RTSP.

## FFmpeg and RTSP

```
ffmpeg -i rtsp://localhost:8554/mystream -c copy output.mp4
```

## FFmpeg and RTMP

```
ffmpeg -i rtmp://localhost/mystream -c copy output.mp4
```

In order to read tracks that make use of modern codecs (AV1, VP9, H265, Opus, FLAC, AC-3) and in order to read multiple video or audio tracks, the `-rtmp_enhanced_codecs` flag must be present and filled with the following values:

```
ffmpeg -rtmp_enhanced_codecs ac-3,av01,avc1,ec-3,fLaC,hvc1,.mp3,mp4a,Opus,vp09 \
-i rtmp://localhost/mystream -c copy output.mp4
```

## FFmpeg and SRT

```
ffmpeg -i 'srt://localhost:8890?streamid=read:test' -c copy output.mp4
```


---

<!-- source: https://mediamtx.org/docs/read/gstreamer -->

# GStreamer

GStreamer can read a stream from the server by using the [RTSP](https://mediamtx.org/docs/read/rtsp), [RTMP](https://mediamtx.org/docs/read/rtmp), [HLS](https://mediamtx.org/docs/read/hls), [SRT](https://mediamtx.org/docs/read/srt) and [WebRTC](https://mediamtx.org/docs/read/webrtc) protocols. The recommended one is RTSP.

## GStreamer and RTSP

```
gst-launch-1.0 rtspsrc location=rtsp://127.0.0.1:8554/mystream latency=0 ! decodebin ! autovideosink
```

## GStreamer and RTMP

GStreamer supports reading streams with the RTMP protocol, but the path must be composed by at least two elements, for instance `mypath/mysubpath`:

```
gst-launch-1.0 rtmpsrc location=rtmp://localhost/mypath/mysubpath ! flvdemux name=d \
d.video ! queue ! decodebin ! autovideosink
```

## GStreamer and SRT

```
gst-launch-1.0 srtsrc uri="srt://localhost:8890?streamid=read:mystream" ! tsdemux ! decodebin ! autovideosink
```

## GStreamer and WebRTC

GStreamer supports reading streams with WebRTC/WHEP, although track codecs must be specified in advance through the `video-caps` and `audio-caps` parameters. Furthermore, if audio is not present, `audio-caps` must be set anyway and must point to a PCMU codec. For instance, the command for reading a video-only H264 stream is:

```
gst-launch-1.0 whepsrc whep-endpoint=http://127.0.0.1:8889/stream/whep use-link-headers=true \
video-caps="application/x-rtp,media=video,encoding-name=H264,payload=127,clock-rate=90000" \
audio-caps="application/x-rtp,media=audio,encoding-name=PCMU,payload=0,clock-rate=8000" \
! rtph264depay ! decodebin ! autovideosink
```

While the command for reading an audio-only Opus stream is:

```
gst-launch-1.0 whepsrc whep-endpoint="http://127.0.0.1:8889/stream/whep" use-link-headers=true \
audio-caps="application/x-rtp,media=audio,encoding-name=OPUS,payload=111,clock-rate=48000,encoding-params=(string)2" \
! rtpopusdepay ! decodebin ! autoaudiosink
```

While the command for reading a H264 and Opus stream is:

```
gst-launch-1.0 whepsrc whep-endpoint=http://127.0.0.1:8889/stream/whep use-link-headers=true \
video-caps="application/x-rtp,media=video,encoding-name=H264,payload=127,clock-rate=90000" \
audio-caps="application/x-rtp,media=audio,encoding-name=OPUS,payload=111,clock-rate=48000,encoding-params=(string)2" \
! decodebin ! autovideosink
```


---

<!-- source: https://mediamtx.org/docs/read/vlc -->

# VLC

VLC can read a stream from the server by using the [RTSP](https://mediamtx.org/docs/read/rtsp), [RTMP](https://mediamtx.org/docs/read/rtmp), [HLS](https://mediamtx.org/docs/read/hls) and [SRT](https://mediamtx.org/docs/read/srt) protocols. The recommended one is RTSP.

In order to minimize latency, it is also suggested to change the `Network caching` parameter of VLC:

1. Open VLC, *Tools*, *Preferences*, *Show Settings*, *All*, page *Input / Codecs*.
2. Find the *Network caching (ms)* parameter, set it to `50`. Save

## VLC and RTSP

Open the following URL:

```
rtsp://localhost:8554/mystream
```

### RTSP and Ubuntu

The VLC shipped with Ubuntu 21.10 doesn’t support playing RTSP due to a license issue (read [here](https://bugs.debian.org/cgi-bin/bugreport.cgi?bug=982299) and [here](https://stackoverflow.com/questions/69766748/cvlc-cannot-play-rtsp-omxplayer-instead-can)). To fix the issue, remove the default VLC instance and install the snap version:

```
sudo apt purge -y vlc
sudo snap install vlc
```

### Encrypted RTSP

At the moment VLC doesn’t support reading encrypted RTSP streams (RTSPS). However, you can use a proxy like [stunnel](https://www.stunnel.org) or [nginx](https://nginx.org/) or a local *MediaMTX* instance to decrypt streams before reading them.

## VLC and RTMP

Open the following URL:

```
rtmp://localhost/mystream
```

## VLC and SRT

Open the following URL:

```
srt://localhost:8890?streamid=read:mystream
```


---

<!-- source: https://mediamtx.org/docs/read/obs-studio -->

# OBS Studio

OBS Studio can read streams from the server by using the [RTSP protocol](https://mediamtx.org/docs/read/rtsp).

Open OBS, click on *Add Source*, *Media source*, *OK*, uncheck *Local file*, insert in *Input*:

```
rtsp://localhost:8554/stream
```

Then *Ok*.


---

<!-- source: https://mediamtx.org/docs/read/python-opencv -->

# Python and OpenCV

Python-based software can read streams from the server with the OpenCV library, acting as a [RTSP client](https://mediamtx.org/docs/read/rtsp).

```
import cv2

cap = cv2.VideoCapture('rtsp://localhost:8554/mystream')
if not cap.isOpened():
    raise Exception("can't open video capture")

while True:
    ret, frame = cap.read()
    if not ret:
        raise Exception("can't receive frame")

    cv2.imshow('frame', frame)

    if cv2.waitKey(1) == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
```


---

<!-- source: https://mediamtx.org/docs/read/golang -->

# Golang

You can read a stream from the server by using the Go programming language and the following libraries:

- [gortsplib](https://github.com/bluenviron/gortsplib) to read with RTSP.
- [gortmplib](https://github.com/bluenviron/gortmplib) to read with RTMP.
- [gohlslib](https://github.com/bluenviron/gohlslib) to read with HLS.
- [gosrt](https://github.com/datarhei/gosrt) to read with SRT.

All these power *MediaMTX* itself. In the repositories of these projects there are several examples on how to connect to a server and read data.


---

<!-- source: https://mediamtx.org/docs/read/unity -->

# Unity

Software written with the Unity Engine can read a stream from the server by using the [WebRTC protocol](https://mediamtx.org/docs/read/webrtc).

Create a new Unity project or open an existing one.

Open *Window -> Package Manager*, click on the plus sign, *Add Package by name…* and insert `com.unity.webrtc`. Wait for the package to be installed.

In the *Project* window, under `Assets`, create a new C# Script called `WebRTCReader.cs` with this content:

```
using System.Collections;
using UnityEngine;
using Unity.WebRTC;

public class WebRTCReader : MonoBehaviour
{
    public string url = "http://localhost:8889/stream/whep";

    private RTCPeerConnection pc;
    private MediaStream receiveStream;

    void Start()
    {
        UnityEngine.UI.RawImage rawImage = gameObject.GetComponentInChildren<UnityEngine.UI.RawImage>();
        AudioSource audioSource = gameObject.GetComponentInChildren<AudioSource>();
        pc = new RTCPeerConnection();
        receiveStream = new MediaStream();

        pc.OnTrack = e =>
        {
            receiveStream.AddTrack(e.Track);
        };

        receiveStream.OnAddTrack = e =>
        {
            if (e.Track is VideoStreamTrack videoTrack)
            {
                videoTrack.OnVideoReceived += (tex) =>
                {
                    rawImage.texture = tex;
                };
            }
            else if (e.Track is AudioStreamTrack audioTrack)
            {
                audioSource.SetTrack(audioTrack);
                audioSource.loop = true;
                audioSource.Play();
            }
        };

        RTCRtpTransceiverInit init = new RTCRtpTransceiverInit();
        init.direction = RTCRtpTransceiverDirection.RecvOnly;
        pc.AddTransceiver(TrackKind.Audio, init);
        pc.AddTransceiver(TrackKind.Video, init);

        StartCoroutine(WebRTC.Update());
        StartCoroutine(createOffer());
    }

    private IEnumerator createOffer()
    {
        var op = pc.CreateOffer();
        yield return op;
        if (op.IsError) {
            Debug.LogError("CreateOffer() failed");
            yield break;
        }

        yield return setLocalDescription(op.Desc);
    }

    private IEnumerator setLocalDescription(RTCSessionDescription offer)
    {
        var op = pc.SetLocalDescription(ref offer);
        yield return op;
        if (op.IsError) {
            Debug.LogError("SetLocalDescription() failed");
            yield break;
        }

        yield return postOffer(offer);
    }

    private IEnumerator postOffer(RTCSessionDescription offer)
    {
        var content = new System.Net.Http.StringContent(offer.sdp);
        content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("application/sdp");
        var client = new System.Net.Http.HttpClient();

        var task = System.Threading.Tasks.Task.Run(async () => {
            var res = await client.PostAsync(new System.UriBuilder(url).Uri, content);
            res.EnsureSuccessStatusCode();
            return await res.Content.ReadAsStringAsync();
        });
        yield return new WaitUntil(() => task.IsCompleted);
        if (task.Exception != null) {
            Debug.LogError(task.Exception);
            yield break;
        }

        yield return setRemoteDescription(task.Result);
    }

    private IEnumerator setRemoteDescription(string answer)
    {
        RTCSessionDescription desc = new RTCSessionDescription();
        desc.type = RTCSdpType.Answer;
        desc.sdp = answer;
        var op = pc.SetRemoteDescription(ref desc);
        yield return op;
        if (op.IsError) {
            Debug.LogError("SetRemoteDescription() failed");
            yield break;
        }

        yield break;
    }

    void OnDestroy()
    {
        pc?.Close();
        pc?.Dispose();
        receiveStream?.Dispose();
    }
}
```

Edit the `url` variable according to your needs.

In the *Hierarchy* window, find or create a scene. Inside the scene, add a *Canvas*. Inside the Canvas, add a *Raw Image* and an *Audio Source*. Then add the `WebRTCReader.cs` script as component of the canvas, by dragging it inside the *Inspector* window. then Press the *Play* button at the top of the page.


---

<!-- source: https://mediamtx.org/docs/references/configuration-file -->

# Configuration file reference

This is a copy of the configuration file (`mediamtx.yml`) of the latest *MediaMTX* release (v1.21.3), that contains all available parameters. Check the [Configuration usage page](https://mediamtx.org/docs/features/configuration) for instructions on how to change it.

```
###############################################
# Global settings

# Settings in this section are applied anywhere.

###############################################
# Global settings -> General

# Verbosity of the program; available values are "error", "warn", "info", "debug".
logLevel: info
# Destinations of log messages; available values are "stdout", "file" and "syslog".
logDestinations: [stdout]
# When destination is "stdout" or "file", emit logs in structured format (JSONL).
logStructured: false
# When "file" is in logDestinations, this is the file which will receive logs.
logFile: mediamtx.log
# When "syslog" is in logDestinations, use prefix for logs.
sysLogPrefix: mediamtx
# Dump packets to disk. This is useful for debugging.
dumpPackets: false

# Timeout of read operations.
readTimeout: 10s
# Timeout of write operations.
writeTimeout: 10s
# Size of the queue of outgoing packets.
# A higher value allows to increase throughput, a lower value allows to save RAM.
writeQueueSize: 512
# Maximum size of outgoing UDP payloads.
# It defaults to the maximum packet size on ethernet (1500) minus IPv6 and UDP headers (48).
# This can be decreased to avoid fragmentation on networks with a low MTU.
udpMaxPayloadSize: 1452
# Size of the read buffer of every UDP socket.
# This can be increased to decrease packet losses.
# It defaults to the default value of the operating system.
udpReadBufferSize: 0

# Command to run when a client connects to the server.
# This is terminated with SIGINT when a client disconnects from the server.
# The following environment variables are available:
# * MTX_CONN_TYPE: connection type
# * MTX_CONN_ID: connection ID
# * RTSP_PORT: RTSP server port
runOnConnect:
# Restart the command if it exits.
runOnConnectRestart: false
# Command to run when a client disconnects from the server.
# Environment variables are the same as runOnConnect.
runOnDisconnect:

###############################################
# Global settings -> Authentication

# Authentication method. Available values:
# * Internal database: credentials are stored in the configuration file
# * External HTTP server: an external HTTP URL is contacted for each authentication request
# * External JWT provider: credentials are signed tokens released by an external identity server
authMethod: internal

# Internal authentication.
# Enabled users.
authInternalUsers:
  # Default unprivileged user.
  # Username. 'any' means any user, including anonymous ones.
  - user: any
    # Password. Not used in case of 'any' user.
    pass:
    # IPs or networks allowed to use this user. An empty list means any IP.
    ips: []
    # Permissions.
    permissions:
      # Available actions are: publish, read, playback, api, metrics, pprof.
      - action: publish
        # Paths can be set to further restrict access to a specific path.
        # An empty path means any path.
        # Regular expressions can be used by using a tilde as prefix.
        path:
      - action: read
        path:
      - action: playback
        path:

    # Default administrator.
    # This allows to use API, metrics and PPROF without authentication,
    # if the IP is localhost.
  - user: any
    pass:
    ips: ["127.0.0.1", "::1"]
    permissions:
      - action: api
      - action: metrics
      - action: pprof

# HTTP-based authentication.
# URL called to perform authentication. Every time a user wants
# to perform an action, the server calls this URL with the POST method
# and a payload described in the documentation.
# If the response code is 20x, the action is allowed, otherwise
# it is forbidden.
authHTTPAddress:
# If the HTTP authentication URL has a self-signed or invalid certificate,
# you can provide the fingerprint of the certificate in order to
# validate it anyway. It can be obtained by running:
# openssl s_client -connect auth_http_domain:443 </dev/null 2>/dev/null | sed -n '/BEGIN/,/END/p' > server.crt
# openssl x509 -in server.crt -noout -fingerprint -sha256 | cut -d "=" -f2 | tr -d ':'
authHTTPFingerprint:
# Actions to exclude from HTTP-based authentication.
# Format is the same as the one of user permissions.
authHTTPExclude: []

# JWT-based authentication.
# Users have to log in through an external identity server and obtain a JWT.
# This JWT must contain the claim "mediamtx_permissions" with permissions,
# for instance:
# {
#  "mediamtx_permissions": [
#     {
#       "action": "publish",
#       "path": "somepath"
#     }
#   ]
# }
# Users are expected to pass the JWT in the Authorization header or as password.
# This is the JWKS URL that will be used to pull (once) the public key that allows
# to validate JWTs.
authJWTJWKS:
# If the JWKS URL has a self-signed or invalid certificate,
# you can provide the fingerprint of the certificate in order to
# validate it anyway. It can be obtained by running:
# openssl s_client -connect jwt_jwks_domain:443 </dev/null 2>/dev/null | sed -n '/BEGIN/,/END/p' > server.crt
# openssl x509 -in server.crt -noout -fingerprint -sha256 | cut -d "=" -f2 | tr -d ':'
authJWTJWKSFingerprint:
# name of the claim that contains permissions.
authJWTClaimKey: mediamtx_permissions
# Actions to exclude from JWT-based authentication.
# Format is the same as the one of user permissions.
authJWTExclude: []
# Expected issuer (iss) claim in the JWT. Leave empty to skip validation.
authJWTIssuer:
# Expected audience (aud) claim in the JWT. Leave empty to skip validation.
authJWTAudience:

###############################################
# Global settings -> Control API

# Enable the control API server, which allows to control the server.
api: false
# Address of the TCP/HTTP listener.
apiAddress: :9997
# Enable HTTPS.
apiEncryption: false
# Path to the server key. This is needed only when encryption is yes.
# This can be generated with:
# openssl genrsa -out server.key 2048
# openssl req -new -x509 -sha256 -key server.key -out server.crt -days 3650
apiServerKey: server.key
# Path to the server certificate.
apiServerCert: server.crt
# Allowed CORS origins.
# Supports wildcards: ['http://*.example.com']
apiAllowOrigins: []
# IPs or CIDRs of proxies placed before the HTTP server.
# These proxies can use the X-Forwarded-For header to set the real IP of clients,
# and the X-Forwarded-Proto header to set the original protocol.
apiTrustedProxies: []

###############################################
# Global settings -> Metrics server

# Enable the metrics server, which allows to extract Prometheus-compatible metrics.
metrics: false
# Address of the TCP/HTTP listener.
metricsAddress: :9998
# Enable HTTPS.
metricsEncryption: false
# Path to the server key. This is needed only when encryption is yes.
# This can be generated with:
# openssl genrsa -out server.key 2048
# openssl req -new -x509 -sha256 -key server.key -out server.crt -days 3650
metricsServerKey: server.key
# Path to the server certificate.
metricsServerCert: server.crt
# Allowed CORS origins.
# Supports wildcards: ['http://*.example.com']
metricsAllowOrigins: []
# IPs or CIDRs of proxies placed before the HTTP server.
# These proxies can use the X-Forwarded-For header to set the real IP of clients,
# and the X-Forwarded-Proto header to set the original protocol.
metricsTrustedProxies: []

###############################################
# Global settings -> PPROF server

# Enable the PPROF server, which allows to extract performance reports.
pprof: false
# Address of the TCP/HTTP listener.
pprofAddress: :9999
# Enable HTTPS.
pprofEncryption: false
# Path to the server key. This is needed only when encryption is yes.
# This can be generated with:
# openssl genrsa -out server.key 2048
# openssl req -new -x509 -sha256 -key server.key -out server.crt -days 3650
pprofServerKey: server.key
# Path to the server certificate.
pprofServerCert: server.crt
# Allowed CORS origins.
# Supports wildcards: ['http://*.example.com']
pprofAllowOrigins: []
# IPs or CIDRs of proxies placed before the HTTP server.
# These proxies can use the X-Forwarded-For header to set the real IP of clients,
# and the X-Forwarded-Proto header to set the original protocol.
pprofTrustedProxies: []

###############################################
# Global settings -> Playback server

# Enable the playback server, which allows to download recordings from the server.
playback: false
# Address of the TCP/HTTP listener.
playbackAddress: :9996
# Enable HTTPS.
playbackEncryption: false
# Path to the server key. This is needed only when encryption is yes.
# This can be generated with:
# openssl genrsa -out server.key 2048
# openssl req -new -x509 -sha256 -key server.key -out server.crt -days 3650
playbackServerKey: server.key
# Path to the server certificate.
playbackServerCert: server.crt
# Allowed CORS origins.
# Supports wildcards: ['http://*.example.com']
playbackAllowOrigins: ["*"]
# IPs or CIDRs of proxies placed before the HTTP server.
# These proxies can use the X-Forwarded-For header to set the real IP of clients,
# and the X-Forwarded-Proto header to set the original protocol.
playbackTrustedProxies: []

###############################################
# Global settings -> RTSP server

# Enable the RTSP server, which allows to publish and read streams with the RTSP protocol.
rtsp: true
# Enabled RTSP transport protocols. The handshake is always performed with TCP.
rtspTransports: [udp, multicast, tcp]
# Use secure protocol variants (RTSPS, SRTP, SRTCP).
# Available values are "no", "strict", "optional".
rtspEncryption: "no"
# Address of the TCP/RTSP listener. This is needed only when encryption is "no" or "optional".
rtspAddress: :8554
# Address of the TCP/RTSPS listener. This is needed only when encryption is "strict" or "optional".
rtspsAddress: :8322
# Address of the UDP/RTP listener. This is needed only when "udp" is in rtspTransports and encryption is "no" or "optional".
rtpAddress: :8000
# Address of the UDP/RTCP listener. This is needed only when "udp" is in rtspTransports and encryption is "no" or "optional".
rtcpAddress: :8001
# IP range of all UDP-multicast listeners. This is needed only when "multicast" is in rtspTransports and encryption is "no" or "optional".
multicastIPRange: 224.1.0.0/16
# Port of all UDP-multicast/RTP listeners. This is needed only when "multicast" is in rtspTransports and encryption is "no" or "optional".
multicastRTPPort: 8002
# Port of all UDP-multicast/RTCP listeners. This is needed only when "multicast" is in rtspTransports and encryption is "no" or "optional".
multicastRTCPPort: 8003
# Address of the UDP/SRTP listener. This is needed only when "udp" is in rtspTransports and encryption is "strict" or "optional".
srtpAddress: :8004
# Address of the UDP/SRTCP listener. This is needed only when "udp" is in rtspTransports and encryption is "strict" or "optional".
srtcpAddress: :8005
# Port of all UDP-multicast/SRTP listeners. This is needed only when "multicast" is in rtspTransports and encryption is "strict" or "optional".
multicastSRTPPort: 8006
# Port of all UDP-multicast/SRTCP listeners. This is needed only when "multicast" is in rtspTransports and encryption is "strict" or "optional".
multicastSRTCPPort: 8007
# Path to the server key. This is needed only when encryption is "strict" or "optional".
# This can be generated with:
# openssl genrsa -out server.key 2048
# openssl req -new -x509 -sha256 -key server.key -out server.crt -days 3650
rtspServerKey: server.key
# Path to the server certificate. This is needed only when encryption is "strict" or "optional".
rtspServerCert: server.crt
# Authentication methods. Available are "basic" and "digest".
# "digest" doesn't provide any additional security and is available for compatibility only.
rtspAuthMethods: [basic]
# IPs or CIDRs of proxies placed before the RTSP server.
# If the server receives a request from one of these entries, IP in logs
# and authentication will be taken from the PROXY protocol header.
rtspTrustedProxies: []

###############################################
# Global settings -> RTMP server

# Enable the RTMP server, which allows to publish and read streams with the RTMP protocol.
rtmp: true
# Use the secure protocol variant (RTMPS).
# Available values are "no", "strict", "optional".
rtmpEncryption: "no"
# Address of the TCP/RTMP listener. This is needed only when encryption is "no" or "optional".
rtmpAddress: :1935
# Address of the TCP/RTMPS listener. This is needed only when encryption is "strict" or "optional".
rtmpsAddress: :1936
# Path to the server key. This is needed only when encryption is "strict" or "optional".
# This can be generated with:
# openssl genrsa -out server.key 2048
# openssl req -new -x509 -sha256 -key server.key -out server.crt -days 3650
rtmpServerKey: server.key
# Path to the server certificate. This is needed only when encryption is "strict" or "optional".
rtmpServerCert: server.crt
# IPs or CIDRs of proxies placed before the RTMP server.
# If the server receives a request from one of these entries, IP in logs
# and authentication will be taken from the PROXY protocol header.
rtmpTrustedProxies: []

###############################################
# Global settings -> HLS server

# Enable the HLS server, which allows to read streams with the HLS protocol.
hls: true
# Address of the TCP/HTTP listener.
hlsAddress: :8888
# Enable HTTPS.
# This is required for Low-Latency HLS to function correctly on Apple devices.
hlsEncryption: false
# Path to the server key. This is needed only when encryption is yes.
# This can be generated with:
# openssl genrsa -out server.key 2048
# openssl req -new -x509 -sha256 -key server.key -out server.crt -days 3650
hlsServerKey: server.key
# Path to the server certificate.
hlsServerCert: server.crt
# Allowed CORS origins.
# Supports wildcards: ['http://*.example.com']
hlsAllowOrigins: ["*"]
# IPs or CIDRs of proxies placed before the HLS server.
# If the server receives a request from one of these entries, IP in logs
# will be taken from the X-Forwarded-For header.
hlsTrustedProxies: []
# By default, HLS is generated only when requested by a user.
# This option allows to generate it always, avoiding the delay between request and generation.
hlsAlwaysRemux: false
# Variant of the HLS protocol to use. Available options are:
# * mpegts - uses MPEG-TS segments, for maximum compatibility.
# * fmp4 - uses fragmented MP4 segments, more efficient.
# * lowLatency - uses Low-Latency HLS.
hlsVariant: lowLatency
# Number of HLS segments to keep on the server.
# Segments allow to seek through the stream.
# Their number doesn't influence latency.
hlsSegmentCount: 7
# Minimum duration of each segment.
# A player usually puts 3 segments in a buffer before reproducing the stream.
# The final segment duration is also influenced by the interval between IDR frames,
# since the server changes the duration in order to include at least one IDR frame
# in each segment.
hlsSegmentDuration: 1s
# Minimum duration of each part.
# A player usually puts 3 parts in a buffer before reproducing the stream.
# Parts are used in Low-Latency HLS in place of segments.
# Part duration is influenced by the distance between video/audio samples
# and is adjusted in order to produce segments with a similar duration.
hlsPartDuration: 200ms
# Maximum size of each segment.
# This prevents RAM exhaustion.
hlsSegmentMaxSize: 50M
# Directory in which to save segments and non-low-latency playlists.
# This has two purposes: offloading RAM and creating a self-consistent directory
# that can be served by a CDN.
hlsDirectory: ""
# The muxer will be closed when there are no
# reader requests and this amount of time has passed.
hlsMuxerCloseAfter: 60s
# Secret to identify requests coming from a CDN.
# The CDN must insert this secret in every request in the
# 'Authorization: Bearer' header.
hlsCDNSecret: ""

###############################################
# Global settings -> WebRTC server

# Enable the WebRTC server, which allows to publish and read streams with the WebRTC protocol.
webrtc: true
# Address of the WebRTC TCP/HTTP listener.
webrtcAddress: :8889
# Enable HTTPS.
# This covers only the WebRTC handshake, while WebRTC streams
# are always encrypted with a key that is exchanged during the WebRTC handshake.
webrtcEncryption: false
# Path to the server key.
# This can be generated with:
# openssl genrsa -out server.key 2048
# openssl req -new -x509 -sha256 -key server.key -out server.crt -days 3650
webrtcServerKey: server.key
# Path to the server certificate.
webrtcServerCert: server.crt
# Allowed CORS origins.
# Supports wildcards: ['http://*.example.com']
webrtcAllowOrigins: ["*"]
# IPs or CIDRs of proxies placed before the WebRTC server.
# If the server receives a request from one of these entries, IP in logs
# will be taken from the X-Forwarded-For header.
webrtcTrustedProxies: []
# Address of a UDP/ICE listener that will receive connections.
# Use a blank string to disable.
webrtcLocalUDPAddress: :8189
# Address of a TCP/ICE listener that will receive connections.
# This is disabled by default since TCP is less efficient than UDP and
# introduces a progressive delay when network is congested.
webrtcLocalTCPAddress: ""
# WebRTC clients need to know the IP of the server.
# Gather IPs from interfaces and send them to clients.
webrtcIPsFromInterfaces: true
# Interfaces whose IPs will be sent to clients.
# An empty value means to use all available interfaces.
webrtcIPsFromInterfacesList: []
# Interfaces whose IPs will NOT be sent to clients.
# This is useful to exclude specific interfaces (e.g. VPN tunnels) while using all others.
webrtcIPsFromInterfacesExcludeList: []
# Additional hosts or IPs to send to clients.
webrtcAdditionalHosts: []
# ICE servers. Needed only when local listeners can't be reached by clients.
# STUN servers allow to obtain and share the public IP of the server.
# TURN/TURNS servers force all traffic through them.
webrtcICEServers2: []
  # - url: stun:stun.l.google.com:19302
  # if user is "AUTH_SECRET", then authentication is secret based.
  # the secret must be inserted into the password field.
  # username: ''
  # password: ''
  # clientOnly: false
# Maximum time to gather STUN candidates.
webrtcSTUNGatherTimeout: 5s
# Time to wait for the WebRTC handshake to complete.
webrtcHandshakeTimeout: 10s
# Maximum time to gather tracks.
webrtcTrackGatherTimeout: 2s

###############################################
# Global settings -> SRT server

# Enable the SRT server, which allows to publish and read streams with the SRT protocol.
srt: true
# Address of the UDP/SRT listener.
srtAddress: :8890

###############################################
# MoQ server

# Enable the MoQ (Media over QUIC) server, which allows to publish and read streams with the MoQ protocol.
moq: true
# Address of the TCP/HTTP2 listener.
# This hosts the web client.
moqHTTP2Address: :8892
# Address of the UDP/HTTP3 listener.
# This hosts the WebTransport endpoint.
moqHTTP3Address: :8892
# Address of the UDP/QUIC listener used for native MoQ-over-QUIC.
moqQUICAddress: :8893
# Path to the server key.
# This can be generated with:
# openssl genrsa -out server.key 2048
# openssl req -new -x509 -sha256 -key server.key -out server.crt -days 3650
# If set to "auto.key", a key is generated automatically and saved in the current folder.
moqServerKey: auto.key
# Path to the server certificate.
moqServerCert: auto.crt
# Allowed origins for CORS.
moqAllowOrigins: ["*"]
# Proxies which are trusted to provide the client's real IP via the X-Forwarded-For header.
moqTrustedProxies: []

###############################################
# Default path settings

# Settings in "pathDefaults" are applied anywhere,
# unless they are overridden in "paths".
pathDefaults:
  ###############################################
  # Default path settings -> General

  # Source of the stream. This can be:
  # * publisher -> the stream is provided by a RTSP, RTMP, WebRTC or SRT client
  # * rtsp://user:pass@host:port/path -> the stream is pulled from another RTSP server / camera
  # * rtsps://user:pass@host:port/path -> the stream is pulled from another RTSP server / camera with RTSPS
  # * rtsp+http://user:pass@host:port/path -> the stream is pulled from another RTSP server / camera, with HTTP tunneling
  # * rtsps+http://user:pass@host:port/path -> the stream is pulled from another RTSP server / camera, with HTTPS tunneling
  # * rtsp+ws://user:pass@host:port/path -> the stream is pulled from another RTSP server / camera, with WebSocket tunneling
  # * rtsps+ws://user:pass@host:port/path -> the stream is pulled from another RTSP server / camera, with secure WebSocket tunneling
  # * rtmp://user:pass@host:port/path#streamKey -> the stream is pulled from another RTMP server / camera
  # * rtmps://user:pass@host:port/path#streamKey -> the stream is pulled from another RTMP server / camera with RTMPS
  # * http://user:pass@host:port/stream.m3u8 -> the stream is pulled from another HLS server / camera
  # * https://user:pass@host:port/stream.m3u8 -> the stream is pulled from another HLS server / camera with HTTPS
  # * udp+mpegts://ip:port -> the stream is pulled from MPEG-TS over UDP, by listening on the specified address
  # * unix+mpegts://socketPath -> the stream is pulled from MPEG-TS over a Unix socket
  # * udp+rtp://ip:port -> the stream is pulled from RTP over UDP, by listening on the specified address
  # * srt://host:port?streamid=streamid -> the stream is pulled from another SRT server / camera
  # * moqt://user:pass@host:port/path -> the stream is pulled from another MoQ server
  # * whep://host:port/path -> the stream is pulled from another WebRTC server / camera with HTTP+WHEP
  # * wheps://host:port/path -> the stream is pulled from another WebRTC server / camera with HTTPS+WHEP
  # * redirect -> the stream is provided by another path or server
  # * rpiCamera -> the stream is provided by a Raspberry Pi Camera
  # The following variables can be used:
  # * $MTX_QUERY: query parameters (passed by first reader)
  # * $G1, $G2, ...: regular expression groups, if path name is a regular expression.
  source: publisher
  # If the source is a URL, and the source TLS certificate is self-signed
  # or invalid, you can provide the fingerprint of the certificate in order to
  # validate it anyway. It can be obtained by running:
  # openssl s_client -connect source_ip:source_port </dev/null 2>/dev/null | sed -n '/BEGIN/,/END/p' > server.crt
  # openssl x509 -in server.crt -noout -fingerprint -sha256 | cut -d "=" -f2 | tr -d ':'
  sourceFingerprint:
  # If the source is a URL, it will be pulled only when at least
  # one reader is connected, saving bandwidth.
  sourceOnDemand: false
  # If sourceOnDemand is "yes", readers will be put on hold until the source is
  # ready or until this amount of time has passed.
  sourceOnDemandStartTimeout: 10s
  # If sourceOnDemand is "yes", the source will be closed when there are no
  # readers connected and this amount of time has passed.
  sourceOnDemandCloseAfter: 10s
  # Maximum number of readers. Zero means no limit.
  maxReaders: 0
  # SRT encryption passphrase required to read from this path.
  srtReadPassphrase:
  # Use absolute timestamp of frames, instead of replacing them with the current time.
  useAbsoluteTimestamp: false

  ###############################################
  # Default path settings -> Always available

  # Enable always-available mode, in which an offline segment is played on repeat when the stream is not available.
  alwaysAvailable: false
  # Tracks of the default offline segment.
  alwaysAvailableTracks: []
    # Available values are: AV1, VP9, H265, H264, Opus, MPEG4Audio, G711, LPCM
    # - codec: H264
    #   # in case of MPEG4Audio, G711, LPCM, sampleRate and ChannelCount must be provided too.
    #   sampleRate: 48000
    #   channelCount: 2
    #   # in case of G711, muLaw must be provided too.
    #   muLaw: false
  # An MP4 file can be used instead of the default offline segment.
  alwaysAvailableFile: ""
  # If recording is enabled, record the stream even while the source is offline and
  # the offline segment is playing. Set to false to record only while a source is connected.
  alwaysAvailableRecorded: true

  ###############################################
  # Default path settings -> Forward

  # Forward the stream of this path to one or more external servers.
  forward: []
    # forward destination. This can be:
    # * rtsp://user:pass@host:port/path -> the stream is forwarded to another RTSP server
    # * rtsps://user:pass@host:port/path -> the stream is forwarded to another RTSP server with RTSPS
    # * rtmp://user:pass@host:port/path#streamKey -> the stream is forwarded to another RTMP server
    # * rtmps://user:pass@host:port/path#streamKey -> the stream is forwarded to another RTMP server with RTMPS
    # * srt://host:port?streamid=streamid -> the stream is forwarded to another SRT server
    # * moqt://user:pass@host:port/path -> the stream is forwarded to another Media-over-QUIC server
    # * whip://host:port/path/whip -> the stream is forwarded to another WebRTC server with WHIP over HTTP
    # * whips://host:port/path/whip -> the stream is forwarded to another WebRTC server with WHIP over HTTPS
    # The following variables can be used:
    # * $MTX_PATH: path name
    # * $G1, $G2, ...: regular expression groups, if path name is a regular expression.
    # - dest:
    #   # If the destination TLS certificate is self-signed
    #   # or invalid, you can provide the fingerprint of the certificate in order to
    #   # validate it anyway. It can be obtained by running:
    #   # openssl s_client -connect dest_ip:dest_port </dev/null 2>/dev/null | sed -n '/BEGIN/,/END/p' > server.crt
    #   # openssl x509 -in server.crt -noout -fingerprint -sha256 | cut -d "=" -f2 | tr -d ':'
    #   destFingerprint:
    #   # Transport protocol used when forwarding with Media-over-QUIC. available values are "quic", "webtransport".
    #   moqTransport: quic
    #   # Token to insert in the Authorization: Bearer header when using WHIP.
    #   whipBearerToken: ""

  ###############################################
  # Default path settings -> Record

  # Record streams to disk.
  record: false
  # Path of recording segments.
  # Extension is added automatically.
  # Available variables are %path (path name), %Y %m %d (year, month, day),
  # %H %M %S (hours, minutes, seconds), %f (microseconds), %z (time zone), %s (unix epoch).
  recordPath: ./recordings/%path/%Y-%m-%d_%H-%M-%S-%f_%z
  # Format of recorded segments.
  # Available formats are "fmp4" (fragmented MP4) and "mpegts" (MPEG-TS).
  recordFormat: fmp4
  # fMP4 segments are concatenation of small MP4 files (parts), each with this duration.
  # MPEG-TS segments are concatenation of 188-bytes packets, flushed to disk with this period.
  # When a system failure occurs, the last part gets lost.
  # Therefore, the part duration is equal to the RPO (recovery point objective).
  recordPartDuration: 1s
  # This prevents RAM exhaustion.
  recordMaxPartSize: 50M
  # Minimum duration of each segment.
  recordSegmentDuration: 1h
  # Delete segments after this timespan.
  # Set to 0s to disable automatic deletion.
  recordDeleteAfter: 1d

  ###############################################
  # Default path settings -> Publisher source (when source is "publisher")

  # Allow another client to disconnect the current publisher and publish in its place.
  overridePublisher: true
  # SRT encryption passphrase required to publish to this path.
  srtPublishPassphrase:
  # Demux MPEG-TS over RTSP into elementary streams.
  # When enabled, RTSP publishers and sources sending a single MP2T/90000 track
  # will be demultiplexed, and their elementary streams (H.264, H.265, AAC, etc.)
  # exposed as native tracks.
  # This allows HLS, WebRTC, and other outputs to work transparently with MPEG-TS sources.
  rtspDemuxMpegts: false

  ###############################################
  # Default path settings -> RTSP source (when source is a RTSP or a RTSPS URL)

  # Transport protocol used to pull the stream. available values are "automatic", "udp", "multicast", "tcp".
  rtspTransport: automatic
  # Support sources that don't provide server ports or use random server ports. This is a security issue
  # and must be used only when interacting with sources that require it.
  rtspAnyPort: false
  # Range header to send to the source, in order to start streaming from the specified offset.
  # available values:
  # * clock: Absolute time
  # * npt: Normal Play Time
  # * smpte: SMPTE timestamps relative to the start of the recording
  rtspRangeType:
  # Available values:
  # * clock: UTC ISO 8601 combined date and time string, e.g. 20230812T120000Z
  # * npt: duration such as "300ms", "1.5m" or "2h45m", valid time units are "ns", "us" (or "µs"), "ms", "s", "m", "h"
  # * smpte: duration such as "300ms", "1.5m" or "2h45m", valid time units are "ns", "us" (or "µs"), "ms", "s", "m", "h"
  rtspRangeStart:
  # Scale header value to send to the source, in order to play the stream at a different speed.
  # Negative values play in reverse, values > 1 fast-forward,
  # values 0 < x < 1 play slow motion.
  rtspScale:
  # Range of ports used as source port in outgoing UDP packets.
  rtspUDPSourcePortRange: [32768, 60999]

  ###############################################
  # Default path settings -> RTP source (when source is RTP)

  # session description protocol (SDP) of the RTP stream.
  rtpSDP:

  ###############################################
  # Default path settings -> MoQ source (when source is a MoQ URL)

  # Transport protocol used to pull the stream. available values are "quic", "webtransport".
  moqTransport: quic

  ###############################################
  # Default path settings -> WebRTC / WHEP source (when source is WHEP)

  # Token to insert in the Authorization: Bearer header.
  whepBearerToken: ""
  # Maximum time to gather STUN candidates.
  whepSTUNGatherTimeout: 5s
  # Time to wait for the WebRTC handshake to complete.
  whepHandshakeTimeout: 10s
  # Maximum time to gather tracks.
  whepTrackGatherTimeout: 2s

  ###############################################
  # Default path settings -> Redirect source (when source is "redirect")

  # Path to which clients will be redirected.
  # It can be a relative path (i.e. /otherstream) or an absolute RTSP URL.
  sourceRedirect:

  ###############################################
  # Default path settings -> Raspberry Pi Camera source (when source is "rpiCamera")

  # ID of the camera.
  rpiCameraCamID: 0
  # Whether this is a secondary stream.
  rpiCameraSecondary: false
  # Width of frames.
  rpiCameraWidth: 1920
  # Height of frames.
  rpiCameraHeight: 1080
  # Flip horizontally.
  rpiCameraHFlip: false
  # Flip vertically.
  rpiCameraVFlip: false
  # Brightness [-1, 1].
  rpiCameraBrightness: 0
  # Contrast [0, 16].
  rpiCameraContrast: 1
  # Saturation [0, 16].
  rpiCameraSaturation: 1
  # Sharpness [0, 16].
  rpiCameraSharpness: 1
  # Exposure mode.
  # values: normal, short, long, custom.
  rpiCameraExposure: normal
  # Auto-white-balance mode.
  # (auto, incandescent, tungsten, fluorescent, indoor, daylight, cloudy or custom).
  rpiCameraAWB: auto
  # Auto-white-balance fixed gains. This can be used in place of rpiCameraAWB.
  # format: [red,blue].
  rpiCameraAWBGains: [0, 0]
  # Denoise operating mode (off, cdn_off, cdn_fast, cdn_hq).
  rpiCameraDenoise: "off"
  # Fixed shutter speed, in microseconds.
  rpiCameraShutter: 0
  # Metering mode of the AEC/AGC algorithm (centre, spot, matrix or custom).
  rpiCameraMetering: centre
  # Fixed gain.
  rpiCameraGain: 0
  # EV compensation of the image in range [-10, 10].
  rpiCameraEV: 0
  # Region of interest, in format x,y,width,height (all normalized between 0 and 1).
  rpiCameraROI:
  # Whether to enable HDR on Raspberry Camera 3.
  rpiCameraHDR: false
  # Tuning file.
  rpiCameraTuningFile:
  # Sensor mode, in format [width]:[height]:[bit-depth]:[packing]
  # bit-depth and packing are optional.
  rpiCameraMode:
  # frames per second.
  rpiCameraFPS: 30
  # Autofocus mode (auto, manual or continuous).
  rpiCameraAfMode: continuous
  # Autofocus range (normal, macro or full).
  rpiCameraAfRange: normal
  # Autofocus speed (normal or fast).
  rpiCameraAfSpeed: normal
  # Lens position (for manual autofocus only), will be set to focus to a specific distance
  # calculated by the following formula: d = 1 / value
  # Examples: 0 moves the lens to infinity.
  #           0.5 moves the lens to focus on objects 2m away.
  #           2 moves the lens to focus on objects 50cm away.
  rpiCameraLensPosition: 0.0
  # Autofocus window, in the form x,y,width,height where the coordinates
  # are given as a proportion of the entire image.
  rpiCameraAfWindow:
  # Manual flicker correction period, in microseconds.
  rpiCameraFlickerPeriod: 0
  # Enables printing text on each frame.
  rpiCameraTextOverlayEnable: false
  # Text that is printed on each frame.
  # format is the one of the strftime() function.
  rpiCameraTextOverlay: "%Y-%m-%d %H:%M:%S - MediaMTX"
  # Codec (auto, hardwareH264, softwareH264 or mjpeg).
  # When is "auto", it defaults to:
  # * hardwareH264 when stream is primary and hardware encoder is available
  # * softwareH264 when stream is primary and hardware encoder is not available
  # * mjpeg when stream is secondary
  rpiCameraCodec: auto
  # Period between IDR frames (when codec is hardwareH264 or softwareH264).
  rpiCameraIDRPeriod: 60
  # Bitrate (when codec is hardwareH264 or softwareH264).
  rpiCameraBitrate: 5000000
  # H264 profile (auto, baseline, main or high).
  # When is "auto", it defaults to:
  # * main when codec is hardwareH264
  # * baseline when codec is softwareH264
  rpiCameraH264Profile: auto
  # H264 level (4.0, 4.1 or 4.2).
  rpiCameraH264Level: "4.1"
  # M-JPEG quality (0-100).
  rpiCameraMJPEGQuality: 60

  ###############################################
  # Default path settings -> Hooks

  # Command to run when this path is initialized.
  # This can be used to publish a stream when the server is launched.
  # This is terminated with SIGINT when the program closes.
  # The following environment variables are available:
  # * MTX_PATH: path name
  # * RTSP_PORT: RTSP server port
  # * G1, G2, ...: regular expression groups, if path name is
  #   a regular expression.
  runOnInit:
  # Restart the command if it exits.
  runOnInitRestart: false

  # Command to run when this path is requested by a reader
  # and no one is publishing to this path yet.
  # This can be used to publish a stream on demand.
  # This is terminated with SIGINT when there are no readers anymore.
  # The following environment variables are available:
  # * MTX_PATH: path name
  # * MTX_QUERY: query parameters (passed by first reader) (url-encoded)
  # * RTSP_PORT: RTSP server port
  # * G1, G2, ...: regular expression groups, if path name is
  #   a regular expression.
  runOnDemand:
  # Restart the command if it exits.
  runOnDemandRestart: false
  # Readers will be put on hold until the runOnDemand command starts publishing
  # or until this amount of time has passed.
  runOnDemandStartTimeout: 10s
  # The command will be closed when there are no
  # readers connected and this amount of time has passed.
  runOnDemandCloseAfter: 10s
  # Command to run when there are no readers anymore.
  # Environment variables are the same as runOnDemand.
  runOnUnDemand:

  # Command to run when the stream is available to be read.
  # This is terminated with SIGINT when the stream is not available anymore.
  # The following environment variables are available:
  # * MTX_PATH: path name
  # * MTX_QUERY: query parameters (passed by publisher) (url-encoded)
  # * MTX_SOURCE_TYPE: source type
  # * MTX_SOURCE_ID: source ID
  # * RTSP_PORT: RTSP server port
  # * G1, G2, ...: regular expression groups, if path name is
  #   a regular expression.
  runOnAvailable:
  # Restart the command if it exits.
  runOnAvailableRestart: false
  # Command to run when the stream is not available anymore.
  # Environment variables are the same as runOnAvailable.
  runOnUnavailable:

  # Command to run when the stream is online, which means
  # that the stream is available and provided by a online source (not an offline segment).
  # This is terminated with SIGINT when the stream is not online anymore.
  # The following environment variables are available:
  # * MTX_PATH: path name
  # * MTX_QUERY: query parameters (passed by publisher) (url-encoded)
  # * MTX_SOURCE_TYPE: source type
  # * MTX_SOURCE_ID: source ID
  # * RTSP_PORT: RTSP server port
  # * G1, G2, ...: regular expression groups, if path name is
  #   a regular expression.
  runOnOnline:
  # Restart the command if it exits.
  runOnOnlineRestart: false
  # Command to run when the stream is not online anymore.
  # Environment variables are the same as runOnOnline.
  runOnOffline:

  # Command to run when a client starts reading.
  # This is terminated with SIGINT when a client stops reading.
  # The following environment variables are available:
  # * MTX_PATH: path name
  # * MTX_QUERY: query parameters (passed by reader) (url-encoded)
  # * MTX_READER_TYPE: reader type
  # * MTX_READER_ID: reader ID
  # * RTSP_PORT: RTSP server port
  # * G1, G2, ...: regular expression groups, if path name is
  #   a regular expression.
  runOnRead:
  # Restart the command if it exits.
  runOnReadRestart: false
  # Command to run when a client stops reading.
  # Environment variables are the same as runOnRead.
  runOnUnread:

  # Command to run when a recording segment is created.
  # The following environment variables are available:
  # * MTX_PATH: path name
  # * MTX_SEGMENT_PATH: segment file path
  # * RTSP_PORT: RTSP server port
  # * G1, G2, ...: regular expression groups, if path name is
  #   a regular expression.
  runOnRecordSegmentCreate:

  # Command to run when a recording segment is complete.
  # The following environment variables are available:
  # * MTX_PATH: path name
  # * MTX_SEGMENT_PATH: segment file path
  # * MTX_SEGMENT_DURATION: segment duration
  # * RTSP_PORT: RTSP server port
  # * G1, G2, ...: regular expression groups, if path name is
  #   a regular expression.
  runOnRecordSegmentComplete:

###############################################
# Path settings

# Settings in "paths" are applied to specific paths, and the map key
# is the name of the path.
# Any setting in "pathDefaults" can be overridden here.
# It's possible to use regular expressions by using a tilde as prefix,
# for example "~^(test1|test2)$" will match both "test1" and "test2",
# for example "~^prefix" will match all paths that start with "prefix".
paths:
  # example:
  # my_camera:
  #   source: rtsp://my_camera

  # Settings under path "all_others" are applied to all paths that
  # do not match another entry.
  all_others:
```


---

<!-- source: https://mediamtx.org/docs/references/control-api -->

# Control API reference

This is the reference of the Control API of the latest *MediaMTX* release (v1.21.3), generated automatically from the [OpenAPI / Swagger file](https://github.com/bluenviron/mediamtx/blob/v1.21.3/api/openapi.yaml) available in the repository. Check the [Control API usage page](https://mediamtx.org/docs/features/control-api) for instructions on how to use the API.


---

<!-- source: https://mediamtx.org/docs/misc/compile -->

# Compile from source

## Standard procedure

1. Install git and Go ≥ 1.27.
2. Clone the repository, enter into the folder and start the building process:`git clone https://github.com/bluenviron/mediamtx cd mediamtx go generate ./... CGO_ENABLED=0 go build .`This will produce the `mediamtx` binary.

## Custom libcamera

If you need to use a custom or external libcamera to interact with some Raspberry Pi Camera models that require it, additional steps are required:

1. Download [mediamtx-rpicamera source code](https://github.com/bluenviron/mediamtx-rpicamera) and compile it against the external libcamera. Instructions are in the repository.
2. Install git and Go ≥ 1.27.
3. Clone the *MediaMTX* repository:`git clone https://github.com/bluenviron/mediamtx`
4. Inside the *MediaMTX* folder, run:`go generate ./...`
5. Copy `build/mtxrpicam_32` and/or `build/mtxrpicam_64` (depending on the architecture) from `mediamtx-rpicamera` to `mediamtx`, inside folder `internal/staticsources/rpicamera/`, overriding existing folders.
6. Compile:`go run .`This will produce the `mediamtx` binary.

## Cross compile

Cross compilation allows to build an executable for a target machine from another machine with a different operating system or architecture. This is useful in case the target machine doesn’t have enough resources for compilation or if you don’t want to install the compilation dependencies on it.

1. On the machine you want to use to compile, install git and Go ≥ 1.27.
2. Clone the repository, enter into the folder and start the building process:`git clone https://github.com/bluenviron/mediamtx cd mediamtx go generate ./... CGO_ENABLED=0 GOOS=my_os GOARCH=my_arch go build .`Replace `my_os` and `my_arch` with the operating system and architecture of your target machine. A list of all supported combinations can be obtained with:`go tool dist list`For instance:`CGO_ENABLED=0 GOOS=linux GOARCH=arm64 go build .`In case of the `arm` architecture, there’s an additional flag available, `GOARM`, that allows to set the ARM version:`CGO_ENABLED=0 GOOS=linux GOARCH=arm64 GOARM=7 go build .`In case of the `mips` architecture, there’s an additional flag available, `GOMIPS`, that allows to set additional parameters:`CGO_ENABLED=0 GOOS=linux GOARCH=mips GOMIPS=softfloat go build .`The command will produce the `mediamtx` binary.

## Compile for all supported platforms

Install Docker and launch:

```
make binaries
```

The command will produce tarballs in folder `binaries/`.

## Docker image

The official Docker image can be recompiled by following these steps:

1. Build binaries for all supported platforms:`make binaries`
2. Build the image by using one of the Dockerfiles inside the `docker/` folder:`docker build . -f docker/standard.Dockerfile -t my-mediamtx`This will produce the `my-mediamtx` image.A Dockerfile is available for each image variant (`standard.Dockerfile`, `ffmpeg.Dockerfile`, `rpi.Dockerfile`, `ffmpeg-rpi.Dockerfile`).


---

<!-- source: https://mediamtx.org/docs/misc/license -->

# License

All the code in the main *MediaMTX* repository is released under the [MIT License](https://github.com/bluenviron/mediamtx/blob/v1.21.3/LICENSE). Compiled binaries include some third-party dependencies:

- all the Golang dependencies listed into the [go.mod file](https://github.com/bluenviron/mediamtx/blob/v1.21.3/go.mod), which are all released under either the MIT license, BSD 3-Clause license or Apache License 2.0.
- hls.js, released under the [Apache License 2.0](https://github.com/video-dev/hls.js/blob/master/LICENSE).
- mediamtx-rpicamera, which is released under the same license of *MediaMTX* but includes some [third-party dependencies](https://github.com/bluenviron/mediamtx-rpicamera?tab=readme-ov-file#license).


---

<!-- source: https://mediamtx.org/docs/misc/security -->

# Security

## Security of released binaries

Binaries published in the [Releases](https://github.com/bluenviron/mediamtx/releases) section of GitHub are the output of a building process that is fully visible, prevents hidden changes or external interferences in published artifacts, and allows validation by third parties:

1. During every release, the [Release workflow](https://github.com/bluenviron/mediamtx/actions/workflows/release.yml) is triggered on GitHub.
2. The release workflow pulls the source code and builds binaries.
3. The release workflow computes SHA256 checksums of binaries and publishes them to a public blockchain (Sigstore Public Good Instance) through [GitHub Attestations](https://docs.github.com/en/actions/concepts/security/artifact-attestations).
4. Checksums and binaries are published on the Release page.
5. Binaries can be downloaded by users.

It is possible to verify that SHA256 checksums of binaries correspond to the one published on Sigstore by running:

```
ls mediamtx_* | xargs -L1 gh attestation verify --repo bluenviron/mediamtx
```

It is possible to verify that binaries have not been altered during transfer from GitHub to the final destination by downloading `checksums.sha256` and running:

```
cat checksums.sha256 | grep "$(ls mediamtx_*)" | sha256sum --check
```

## Reporting vulnerabilities

Vulnerabilities can be reported privately by using the [Security Advisory](https://github.com/bluenviron/mediamtx/security/advisories/new) feature of GitHub.


---

<!-- source: https://mediamtx.org/docs/misc/specifications -->

# Specifications

| name | area |
|---|---|
| [RTSP / RTP / RTCP specifications](https://github.com/bluenviron/gortsplib#specifications) | RTSP |
| [HLS specifications](https://github.com/bluenviron/gohlslib#specifications) | HLS |
| [RTMP specifications](https://github.com/bluenviron/gortmplib#specifications) | RTMP |
| [WebRTC: Real-Time Communication in Browsers](https://www.w3.org/TR/webrtc/) | WebRTC |
| [RFC8835, Transports for WebRTC](https://datatracker.ietf.org/doc/html/rfc8835) | WebRTC |
| [RFC7742, WebRTC Video Processing and Codec Requirements](https://datatracker.ietf.org/doc/html/rfc7742) | WebRTC |
| [RFC7874, WebRTC Audio Codec and Processing Requirements](https://datatracker.ietf.org/doc/html/rfc7874) | WebRTC |
| [RFC7875, Additional WebRTC Audio Codecs for Interoperability](https://datatracker.ietf.org/doc/html/rfc7875) | WebRTC |
| [H.265 Profile for WebRTC](https://datatracker.ietf.org/doc/html/draft-ietf-avtcore-hevc-webrtc-08) | WebRTC |
| [RFC9725, WebRTC-HTTP Ingestion Protocol (WHIP)](https://datatracker.ietf.org/doc/html/rfc9725) | WebRTC |
| [WebRTC-HTTP Egress Protocol (WHEP)](https://datatracker.ietf.org/doc/html/draft-ietf-wish-whep) | WebRTC |
| [RFC9000, QUIC: A UDP-Based Multiplexed and Secure Transport](https://datatracker.ietf.org/doc/html/rfc9000) | Media-over-QUIC |
| [RFC9114, HTTP/3](https://datatracker.ietf.org/doc/html/rfc9114) | Media-over-QUIC |
| [Media over QUIC Transport](https://datatracker.ietf.org/doc/html/draft-ietf-moq-transport) | Media-over-QUIC |
| [MOQT Streaming Format (MSF)](https://datatracker.ietf.org/doc/html/draft-ietf-moq-msf-00) | Media-over-QUIC |
| [Low Overhead Media Container (LOC)](https://datatracker.ietf.org/doc/draft-ietf-moq-loc/) | Media-over-QUIC |
| [The SRT Protocol](https://haivision.github.io/srt-rfc/draft-sharabayko-srt.html) | SRT |
| [Codec specifications](https://github.com/bluenviron/mediacommon#specifications) | codecs |
| [Golang project layout](https://github.com/golang-standards/project-layout) | project layout |


---

<!-- source: https://mediamtx.org/docs/misc/related-projects -->

# Related projects

- [gortsplib (RTSP library used internally)](https://github.com/bluenviron/gortsplib)
- [gohlslib (HLS library used internally)](https://github.com/bluenviron/gohlslib)
- [gortmplib (RTMP library used internally)](https://github.com/bluenviron/gortmplib)
- [mediacommon (codecs and formats library used internally)](https://github.com/bluenviron/mediacommon)
- [mediamtx-rpicamera (Raspberry Pi Camera component)](https://github.com/bluenviron/mediamtx-rpicamera)
- [datarhei/gosrt (SRT library used internally)](https://github.com/datarhei/gosrt)
- [pion/webrtc (WebRTC library used internally)](https://github.com/pion/webrtc)
- [pion/sdp (SDP library used internally)](https://github.com/pion/sdp)
- [pion/rtp (RTP library used internally)](https://github.com/pion/rtp)
- [pion/rtcp (RTCP library used internally)](https://github.com/pion/rtcp)
- [quic-go/quic-go (QUIC library used internally)](https://github.com/quic-go/quic-go)
- [quic-go/webtransport-go (WebTransport library used internally)](https://github.com/quic-go/webtransport-go)
- [go-astits (MPEG-TS library used internally)](https://github.com/asticode/go-astits)
- [go-mp4 (MP4 library used internally)](https://github.com/abema/go-mp4)
- [hls.js (browser-side HLS library used internally)](https://github.com/video-dev/hls.js)

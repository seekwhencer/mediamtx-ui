FROM debian:12-slim

ENV DEBIAN_FRONTEND=noninteractive
ENV DISPLAY=:99

RUN apt-get update && apt-get install -y \
    dbus \
    chromium \
    xvfb \
    ffmpeg \
    fonts-liberation \
    ca-certificates \
    dbus-x11 \
 && rm -rf /var/lib/apt/lists/*

RUN dbus-daemon --system --fork

# optional: verhindert Chrome-Crashes
RUN mkdir -p /tmp/.X11-unix && chmod 1777 /tmp/.X11-unix

WORKDIR /app
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

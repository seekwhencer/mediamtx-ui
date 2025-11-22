FROM linuxserver/ffmpeg:latest

VOLUME ["/app/server/node_modules"]

RUN apt-get update -y
RUN apt-get install v4l-utils uvcdynctrl psmisc -y

# Installing node.js via n

RUN apt-get install git make curl -y
RUN curl -L https://bit.ly/n-install | bash -s -- -y
RUN ln -s "/root/n/bin/n" "/usr/bin/n"
#RUN chown -R root:root "/root/.npm"
#RUN chmod 777 -R "/root/.npm"
RUN n 22

WORKDIR /app/server
COPY server/package*.json .
RUN npm install

WORKDIR /app
COPY . .

ENTRYPOINT [""]

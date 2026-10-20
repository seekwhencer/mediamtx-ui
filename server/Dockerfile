FROM node:22-alpine

#
WORKDIR /app

#
COPY server/package*.json ./server/
RUN cd server && npm install

RUN npm install -g npm-check-updates

#
COPY server/ ./server/

#
COPY frontend ./frontend
RUN cd frontend && npm install && npm run build

#
EXPOSE 3000

#
WORKDIR /app/server
CMD ["node", "index.js"]

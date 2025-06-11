FROM node:20-alpine AS base
WORKDIR /usr/app
COPY . ./
RUN npm ci install
RUN npm run build


FROM node:20-alpine AS build
WORKDIR /usr/app
COPY package.json ./
RUN npm install --omit=dev
COPY --from=base /usr/app/dist ./
CMD [ "node", "/usr/app/main.js" ]
RUN ln -s /usr/share/zoneinfo/America/Bogota /etc/localtime
EXPOSE 3000
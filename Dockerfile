FROM node:22

ARG NEXT_PUBLIC_EVE_SSO_AUTH_HOST
ARG NEXT_PUBLIC_EVE_IMAGES_API_HOST
ARG NEXT_PUBLIC_EVE_ESI_HOST
ARG NEXT_PUBLIC_DOMAIN
ARG NEXT_PUBLIC_EVE_SSO_ID

ENV PORT 3000
ENV NEXT_PUBLIC_EVE_SSO_AUTH_HOST=$NEXT_PUBLIC_EVE_SSO_AUTH_HOST
ENV NEXT_PUBLIC_EVE_IMAGES_API_HOST=$NEXT_PUBLIC_EVE_IMAGES_API_HOST
ENV NEXT_PUBLIC_EVE_ESI_HOST=$NEXT_PUBLIC_EVE_ESI_HOST
ENV NEXT_PUBLIC_DOMAIN=$NEXT_PUBLIC_DOMAIN
ENV NEXT_PUBLIC_EVE_SSO_ID=$NEXT_PUBLIC_EVE_SSO_ID

RUN apt-get update \
    && apt-get install -y \
        python3 \
        make \
        g++ \
        sqlite3 \
        libsqlite3-dev \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package*.json /usr/src/app/
# Copying source files
COPY . /usr/src/app

RUN npm install

# Building app
RUN npm run build
EXPOSE 3000

WORKDIR /usr/src/app
# Running the app
CMD "npm" "run" "start"
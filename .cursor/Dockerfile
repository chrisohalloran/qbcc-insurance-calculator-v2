FROM node:22-bookworm-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends git build-essential python3 ca-certificates \
    && rm -rf /var/lib/apt/lists/*

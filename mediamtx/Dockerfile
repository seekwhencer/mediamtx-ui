# syntax=docker/dockerfile:1
#
# Compiles MediaMTX from the main branch (or any ref) into an image with FFmpeg and NVIDIA CUDA support.
# Mirrors the official build (docker/standard.Dockerfile + scripts/binaries.mk):
#   - base:   golang:1.27-alpine3.24 (builder)
#   - runtime: nvidia/cuda:12.5.1-runtime-ubuntu22.04 (with FFmpeg & CUDA support)
#
# Build args:
#   MEDIAMTX_REF   branch / tag / full commit SHA (default: main)
#   MEDIAMTX_REPO  repo URL (default: bluenviron/mediamtx)
#
# Example (pin to a release instead of main):
#   docker build -f mediamtx/Dockerfile --build-arg MEDIAMTX_REF=v1.21.2 .

# ===== 1. Builder: fetch source + compile =====
FROM golang:1.27-alpine3.24 AS builder

ARG MEDIAMTX_REF=main
ARG MEDIAMTX_REPO=https://github.com/bluenviron/mediamtx

RUN apk add --no-cache git ca-certificates

WORKDIR /build

# Clone the repo (cached layer).
RUN git clone "${MEDIAMTX_REPO}" mediamtx

# Move into the repo for all subsequent steps (WORKDIR persists across RUNs, cd does not).
WORKDIR /build/mediamtx

# Check out the requested ref (branch, tag, or full SHA).
RUN git checkout "${MEDIAMTX_REF}" && git log -1 --oneline

# Download modules, run codegen, build a static binary for the host arch.
RUN go mod download \
 && go generate ./... \
 && CGO_ENABLED=0 GOOS=linux GOARCH=${TARGETARCH:-amd64} go build -ldflags="-s -w" -o /out/mediamtx .

# ===== 2. Runtime: NVIDIA CUDA base image with FFmpeg =====
# Uses an official NVIDIA CUDA runtime image (Ubuntu 22.04 based) 
# to enable GPU hardware acceleration (NVENC/NVDEC) for FFmpeg.
FROM nvidia/cuda:13.4.3-runtime-ubuntu22.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    ca-certificates \
    tzdata \
 && rm -rf /var/lib/apt/lists/*

COPY --from=builder /out/mediamtx /mediamtx

# Config is mounted by compose at /mediamtx.yml (see compose-mediamtx-build.yml).
ENTRYPOINT ["/mediamtx"]
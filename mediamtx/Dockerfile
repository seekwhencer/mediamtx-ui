# syntax=docker/dockerfile:1
#
# Compiles MediaMTX from the main branch (or any ref) into a minimal image.
# Mirrors the official build (docker/standard.Dockerfile + scripts/binaries.mk):
#   - base:   golang:1.27-alpine3.24
#   - output: CGO_ENABLED=0 static binary for the host architecture
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

# ===== 2. Runtime: minimal image with just the binary =====
# Matches the official docker/standard.Dockerfile: `scratch` base, binary at /mediamtx.
# Note: `scratch` has no shell / CA bundle. If you need HTTPS to external services
# (JWT JWKS, external auth) or a debug shell, switch this to `alpine:3.24` and add
# `RUN apk add --no-cache ca-certificates tzdata`.
FROM scratch

COPY --from=builder /out/mediamtx /mediamtx

# Config is mounted by compose at /mediamtx.yml (see compose-mediamtx-build.yml).
ENTRYPOINT ["/mediamtx"]

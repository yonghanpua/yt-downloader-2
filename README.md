# YT Downloader

A self-hosted YouTube downloader web app built with Next.js. Paste a YouTube URL, view video info, and download in various qualities.

## Features

- Paste any YouTube URL to fetch video metadata (title, thumbnail, duration, views)
- Download video in multiple qualities (360p to 4K) as MP4
- Download audio only as M4A
- Download progress indicator with byte counts and percentage
- One-click yt-dlp update from the web UI
- Dark theme UI
- Docker-ready for self-hosting

## Getting Started

### Prerequisites

- Node.js 22+
- Python 3 (required by yt-dlp)
- ffmpeg (required for merging video + audio tracks)

### Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

### Docker (recommended)

```bash
docker build -t yt-downloader .
docker run -d --name yt-downloader -p 3000:3000 --restart unless-stopped yt-downloader
```

The Docker image includes Python 3 and ffmpeg.

### Accessing from anywhere

**Reverse proxy (Caddy)** — auto HTTPS with a domain name:

```
yourdomain.com {
    reverse_proxy localhost:3000
}
```

Then port-forward 80/443 on your router to the server.

**Cloudflare Tunnel** — expose the app without opening any ports:

```bash
cloudflared tunnel --url http://localhost:3000
```

**Tailscale / ZeroTier** — access via VPN IP without port forwarding. Most secure, but requires the VPN client on each device.

### Updating

```bash
docker stop yt-downloader && docker rm yt-downloader
docker build -t yt-downloader .
docker run -d --name yt-downloader -p 3000:3000 --restart unless-stopped yt-downloader
```

## Tech Stack

- [Next.js](https://nextjs.org) with App Router
- [Tailwind CSS](https://tailwindcss.com) v4
- [yt-dlp](https://github.com/yt-dlp/yt-dlp) via `youtube-dl-exec`

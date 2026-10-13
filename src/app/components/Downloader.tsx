"use client";

import { useState, useCallback, FormEvent } from "react";

interface VideoInfo {
  title: string;
  thumbnail: string;
  duration: number;
  author: string;
  viewCount: number;
  availableQualities: number[];
}

interface DownloadState {
  status: "idle" | "downloading" | "done" | "error";
  progress: number;
  received: number;
  total: number;
}

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

function formatViews(count: number) {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M views`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K views`;
  return `${count} views`;
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function DownloadIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg
      className="animate-spin h-5 w-5"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

function SmallSpinner() {
  return (
    <svg
      className="animate-spin h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function VideoIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  );
}

function AudioIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}

function DownloadRow({
  label,
  sublabel,
  icon,
  href,
  downloadKey,
  downloads,
  onDownload,
}: {
  label: string;
  sublabel: string;
  icon: React.ReactNode;
  href: string;
  downloadKey: string;
  downloads: Record<string, DownloadState>;
  onDownload: (key: string, href: string) => void;
}) {
  const state = downloads[downloadKey];
  const isDownloading = state?.status === "downloading";
  const isDone = state?.status === "done";
  const isError = state?.status === "error";

  return (
    <div className="relative">
      <button
        onClick={() => onDownload(downloadKey, href)}
        disabled={isDownloading}
        className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-input-bg hover:bg-input-border disabled:hover:bg-input-bg transition-colors group text-left relative overflow-hidden"
      >
        {isDownloading && state.total > 0 && (
          <div
            className="absolute inset-0 bg-accent/10 transition-all duration-300"
            style={{ width: `${state.progress}%` }}
          />
        )}
        <div className="flex items-center gap-3 relative z-10">
          <span className="text-muted">{icon}</span>
          <span className="font-medium text-sm">{label}</span>
          <span className="text-xs text-muted">{sublabel}</span>
        </div>
        <div className="flex items-center gap-2 relative z-10">
          {isDownloading && (
            <span className="text-xs text-muted">
              {state.total > 0
                ? `${formatBytes(state.received)} / ${formatBytes(state.total)} · ${state.progress}%`
                : `${formatBytes(state.received)} downloaded`}
            </span>
          )}
          {isDone && (
            <span className="text-xs text-green-400">Complete</span>
          )}
          {isError && (
            <span className="text-xs text-red-400">Failed — retry</span>
          )}
          <span
            className={
              isDownloading
                ? "text-accent"
                : isDone
                  ? "text-green-400"
                  : isError
                    ? "text-red-400"
                    : "text-muted group-hover:text-accent transition-colors"
            }
          >
            {isDownloading ? (
              <SmallSpinner />
            ) : isDone ? (
              <CheckIcon />
            ) : (
              <DownloadIcon />
            )}
          </span>
        </div>
      </button>
    </div>
  );
}

export default function Downloader() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [error, setError] = useState("");
  const [downloads, setDownloads] = useState<Record<string, DownloadState>>({});

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError("");
    setVideoInfo(null);
    setDownloads({});

    try {
      const res = await fetch("/api/info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch video info");
      }

      setVideoInfo(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const handleDownload = useCallback(
    async (key: string, href: string) => {
      if (downloads[key]?.status === "downloading") return;

      setDownloads((prev) => ({
        ...prev,
        [key]: { status: "downloading", progress: 0, received: 0, total: 0 },
      }));

      try {
        const res = await fetch(href);

        if (!res.ok) {
          throw new Error("Download failed");
        }

        const contentLength = res.headers.get("Content-Length");
        const total = contentLength ? parseInt(contentLength, 10) : 0;
        const contentDisposition = res.headers.get("Content-Disposition");
        const filenameMatch = contentDisposition?.match(
          /filename="?([^";\n]+)"?/,
        );
        const filename = filenameMatch?.[1] || "download";

        setDownloads((prev) => ({
          ...prev,
          [key]: { status: "downloading", progress: 0, received: 0, total },
        }));

        const reader = res.body!.getReader();
        const chunks: Uint8Array[] = [];
        let received = 0;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          chunks.push(value);
          received += value.length;

          const progress = total > 0 ? Math.round((received / total) * 100) : 0;

          setDownloads((prev) => ({
            ...prev,
            [key]: { status: "downloading", progress, received, total },
          }));
        }

        const blob = new Blob(chunks as BlobPart[]);
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);

        setDownloads((prev) => ({
          ...prev,
          [key]: { status: "done", progress: 100, received, total },
        }));
      } catch {
        setDownloads((prev) => ({
          ...prev,
          [key]: { status: "error", progress: 0, received: 0, total: 0 },
        }));
      }
    },
    [downloads],
  );

  const encodedUrl = encodeURIComponent(url.trim());

  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold tracking-tight mb-2">
          YT Downloader
        </h1>
        <p className="text-muted text-sm">
          Paste a YouTube link to download video or audio
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 mb-8">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://youtube.com/watch?v=..."
          className="flex-1 px-4 py-3 rounded-lg bg-input-bg border border-input-border text-foreground placeholder:text-muted/50 focus:outline-none focus:border-accent transition-colors text-sm"
        />
        <button
          type="submit"
          disabled={loading || !url.trim()}
          className="px-6 py-3 rounded-lg bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-sm transition-colors flex items-center gap-2 shrink-0"
        >
          {loading ? <Spinner /> : "Get Info"}
        </button>
      </form>

      {error && (
        <div className="mb-6 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {videoInfo && (
        <div className="rounded-xl border border-card-border bg-card overflow-hidden">
          <div className="flex gap-4 p-4">
            {videoInfo.thumbnail && (
              <img
                src={videoInfo.thumbnail}
                alt={videoInfo.title}
                className="w-44 h-auto rounded-lg object-cover flex-shrink-0"
              />
            )}
            <div className="min-w-0 flex flex-col justify-center">
              <h2 className="font-semibold text-sm leading-snug mb-1 line-clamp-2">
                {videoInfo.title}
              </h2>
              <p className="text-muted text-xs">{videoInfo.author}</p>
              <p className="text-muted text-xs mt-1">
                {formatDuration(videoInfo.duration)} &middot;{" "}
                {formatViews(videoInfo.viewCount)}
              </p>
            </div>
          </div>

          <div className="px-4 pb-2">
            <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
              Video (MP4)
            </h3>
            <div className="flex flex-col gap-1.5">
              {videoInfo.availableQualities.map((q) => (
                <DownloadRow
                  key={q}
                  label={`${q}p`}
                  sublabel="MP4"
                  icon={<VideoIcon />}
                  href={`/api/download?url=${encodedUrl}&quality=${q}&type=video`}
                  downloadKey={`video-${q}`}
                  downloads={downloads}
                  onDownload={handleDownload}
                />
              ))}
            </div>
          </div>

          <div className="px-4 pt-3 pb-4">
            <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
              Audio Only
            </h3>
            <div className="flex flex-col gap-1.5">
              <DownloadRow
                label="Best Quality"
                sublabel="M4A"
                icon={<AudioIcon />}
                href={`/api/download?url=${encodedUrl}&type=audio`}
                downloadKey="audio"
                downloads={downloads}
                onDownload={handleDownload}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

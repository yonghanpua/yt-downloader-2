import { spawn } from "child_process";
import { NextRequest } from "next/server";
import path from "path";
import os from "os";
import fs from "fs";
import crypto from "crypto";

export const maxDuration = 300;

const YT_URL_RE =
  /^https?:\/\/(www\.|m\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)/;

function getYtDlpPath(): string {
  const ext = process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp";
  return path.join(process.cwd(), "node_modules", "youtube-dl-exec", "bin", ext);
}

function runYtDlp(
  args: string[],
): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const proc = spawn(getYtDlpPath(), args, {
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (d: Buffer) => (stdout += d.toString()));
    proc.stderr.on("data", (d: Buffer) => (stderr += d.toString()));
    proc.on("close", (code) => resolve({ code: code ?? 1, stdout, stderr }));
  });
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  const quality = req.nextUrl.searchParams.get("quality");
  const type = req.nextUrl.searchParams.get("type") || "video";

  if (!url || !YT_URL_RE.test(url)) {
    return new Response("Invalid URL", { status: 400 });
  }

  const tmpId = crypto.randomBytes(8).toString("hex");
  const tmpDir = path.join(os.tmpdir(), `ytdl-${tmpId}`);

  try {
    fs.mkdirSync(tmpDir, { recursive: true });

    const outputTemplate = path.join(tmpDir, "%(title)s.%(ext)s");
    const ytdlpPath = getYtDlpPath();
    const args: string[] = ["--no-check-certificates", "--no-warnings"];

    let ext: string;

    if (type === "audio") {
      args.push("-f", "bestaudio[ext=m4a]/bestaudio", "-o", outputTemplate);
      ext = "m4a";
    } else {
      const formatStr = quality
        ? `bestvideo[height<=${quality}]+bestaudio/best[height<=${quality}]`
        : "bestvideo+bestaudio/best";
      args.push(
        "-f",
        formatStr,
        "--merge-output-format",
        "mp4",
        "-o",
        outputTemplate,
      );
      ext = "mp4";
    }

    args.push("--", url);

    const result = await runYtDlp(args);

    if (result.code !== 0) {
      console.error("yt-dlp error:", result.stderr);
      return new Response("Download failed", { status: 500 });
    }

    const files = fs.readdirSync(tmpDir);
    if (files.length === 0) {
      return new Response("No file produced", { status: 500 });
    }

    const filePath = path.join(tmpDir, files[0]);
    const stat = fs.statSync(filePath);
    const fileStream = fs.createReadStream(filePath);

    const safeName = files[0].replace(/[^\w\s.\-()]/g, "").trim() || `download.${ext}`;

    const readable = new ReadableStream({
      start(controller) {
        fileStream.on("data", (chunk: Buffer | string) => {
          controller.enqueue(new Uint8Array(Buffer.from(chunk)));
        });
        fileStream.on("end", () => {
          controller.close();
          fs.rmSync(tmpDir, { recursive: true, force: true });
        });
        fileStream.on("error", (err) => {
          controller.error(err);
          fs.rmSync(tmpDir, { recursive: true, force: true });
        });
      },
      cancel() {
        fileStream.destroy();
        fs.rmSync(tmpDir, { recursive: true, force: true });
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${safeName}"`,
        "Content-Length": String(stat.size),
      },
    });
  } catch (err) {
    console.error("Download error:", err);
    fs.rmSync(tmpDir, { recursive: true, force: true });
    return new Response("Download failed", { status: 500 });
  }
}

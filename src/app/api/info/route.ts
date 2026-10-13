import youtubedl from "youtube-dl-exec";
import { NextRequest, NextResponse } from "next/server";

const YT_URL_RE =
  /^https?:\/\/(www\.|m\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)/;

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url || !YT_URL_RE.test(url)) {
      return NextResponse.json(
        { error: "Invalid YouTube URL" },
        { status: 400 },
      );
    }

    const info = (await youtubedl(url, {
      dumpSingleJson: true,
      noCheckCertificates: true,
      noWarnings: true,
    })) as Record<string, unknown>;

    const formats = (info.formats as Record<string, unknown>[]) ?? [];
    const heights = new Set<number>();
    for (const f of formats) {
      if (f.vcodec !== "none" && f.height) {
        heights.add(f.height as number);
      }
    }

    const standardQualities = [2160, 1440, 1080, 720, 480, 360];
    const availableQualities = standardQualities.filter((q) => heights.has(q));

    return NextResponse.json({
      title: info.title,
      thumbnail: info.thumbnail,
      duration: info.duration,
      author: info.uploader || info.channel,
      viewCount: info.view_count,
      availableQualities,
    });
  } catch (err) {
    console.error("Info route error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to fetch video info: ${message}` },
      { status: 500 },
    );
  }
}

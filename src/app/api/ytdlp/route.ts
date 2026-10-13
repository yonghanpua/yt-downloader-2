import { execFile } from "child_process";
import { NextResponse } from "next/server";
import path from "path";

function getYtDlpPath(): string {
  const ext = process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp";
  return path.join(
    process.cwd(),
    "node_modules",
    "youtube-dl-exec",
    "bin",
    ext,
  );
}

function run(
  bin: string,
  args: string[],
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    execFile(bin, args, { timeout: 60_000 }, (err, stdout, stderr) => {
      if (err) reject(err);
      else resolve({ stdout: stdout.toString(), stderr: stderr.toString() });
    });
  });
}

export async function GET() {
  try {
    const { stdout } = await run(getYtDlpPath(), ["--version"]);
    return NextResponse.json({ version: stdout.trim() });
  } catch {
    return NextResponse.json({ version: "unknown" }, { status: 500 });
  }
}

export async function POST() {
  try {
    const bin = getYtDlpPath();
    const { stdout, stderr } = await run(bin, ["-U"]);
    const output = (stdout + "\n" + stderr).trim();

    const { stdout: newVersion } = await run(bin, ["--version"]);

    return NextResponse.json({
      success: true,
      output,
      version: newVersion.trim(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Update failed";
    return NextResponse.json({ success: false, output: message }, { status: 500 });
  }
}

import ffmpeg from "fluent-ffmpeg";
import path from "path";
import { app } from "electron";
import ffmpegPath from "ffmpeg-static";
import archiver from "archiver";
import { promises as fs } from "fs";
import { createWriteStream } from "fs";
import os from "os";

// Ensure FFMPEG path is set correctly for both dev and production
function getFFmpegPath(): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "ffmpeg");
  } else {
    return ffmpegPath as unknown as string;
  }
}

// Set FFMPEG path when module loads
ffmpeg.setFfmpegPath(getFFmpegPath());

function isWavFile(wavFilename: string) {
  const ext = path.extname(wavFilename);
  return ext === ".wav";
}

export interface ConversionOptions {
  bitrate?: number;
  quality?: number;
  onProgress?: (progress: number) => void;
}

export interface ConversionResult {
  success: boolean;
  outputPath: string;
  originalName: string;
  error?: string;
}

export function convertWavToMp3(
  wavFilename: string,
  outputPath: string,
  options: ConversionOptions = {}
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!isWavFile(wavFilename)) {
      return reject(new Error("Not a WAV file"));
    }

    const { bitrate = 320, quality = 2, onProgress } = options;

    ffmpeg(wavFilename)
      .audioBitrate(bitrate)
      .audioQuality(quality)
      .format("mp3")
      .on("error", (err) => reject(err))
      .on("progress", (progress) => {
        if (onProgress && progress.percent) {
          onProgress(Math.round(progress.percent));
        }
      })
      .on("end", () => resolve(outputPath))
      .save(outputPath);
  });
}

export async function convertMultipleFiles(
  inputFiles: Array<{ path: string; name: string }>,
  outputDir: string,
  options: ConversionOptions = {}
): Promise<ConversionResult[]> {
  const results: ConversionResult[] = [];

  for (const file of inputFiles) {
    try {
      const outputFileName = file.name.replace(/\.wav$/i, ".mp3");
      const outputPath = path.join(outputDir, outputFileName);

      await convertWavToMp3(file.path, outputPath, options);

      results.push({
        success: true,
        outputPath,
        originalName: file.name,
      });
    } catch (error) {
      results.push({
        success: false,
        outputPath: "",
        originalName: file.name,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return results;
}

export async function createZipFromFiles(filePaths: string[], zipPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = createWriteStream(zipPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", () => resolve());
    archive.on("error", (err) => reject(err));

    archive.pipe(output);

    filePaths.forEach((filePath) => {
      const fileName = path.basename(filePath);
      archive.file(filePath, { name: fileName });
    });

    archive.finalize();
  });
}

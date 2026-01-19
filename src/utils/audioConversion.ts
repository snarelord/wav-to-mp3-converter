import ffmpeg from "fluent-ffmpeg";
import path from "path";
import { app } from "electron";
import ffmpegPath from "ffmpeg-static";
import archiver from "archiver";
import { promises as fs } from "fs";
import { createWriteStream } from "fs";

const FORMAT_PRIORITY: Record<string, number> = {
  ".wav": 1,
  ".aiff": 2,
  ".aif": 2,
  ".flac": 3,
  ".m4a": 4,
  ".aac": 5,
  ".ogg": 6,
};

function getFileExtension(filename: string): string {
  return filename.toLowerCase().substring(filename.lastIndexOf("."));
}

function getFormatPriority(filename: string): number {
  const ext = getFileExtension(filename);
  return FORMAT_PRIORITY[ext] || 99;
}

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

// function isWavFile(wavFilename: string) {
//   const ext = path.extname(wavFilename);
//   return ext === ".wav";
// }

function isSupportedAudioFile(filename: string): boolean {
  const ext = getFileExtension(filename);
  return ext in FORMAT_PRIORITY;
}

export interface ConversionOptions {
  bitrate?: number;
  quality?: number;
  onProgress?: (progress: number, total: number) => void;
}

export interface ConversionResult {
  success: boolean;
  outputPath?: string;
  inputFile: string;
  error?: string;
}

export function convertAudioToMp3(inputFilename: string, outputPath: string, bitrate: number = 320): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!isSupportedAudioFile(inputFilename)) {
      const ext = getFileExtension(inputFilename);
      return reject(new Error(`Unsupported audio format: ${ext}`));
    }

    ffmpeg(inputFilename)
      .audioBitrate(bitrate)
      .audioCodec("libmp3lame") // Explicitly set MP3 codec
      .format("mp3")
      .on("error", (err) => reject(err))
      .on("end", () => resolve(outputPath))
      .save(outputPath);
  });
}

export async function convertMultipleFiles(
  inputFiles: Array<{ path: string; name: string }>,
  outputDir: string,
  options: ConversionOptions = {}
): Promise<ConversionResult[]> {
  const { bitrate = 320, onProgress } = options;

  const sortedFiles = [...inputFiles].sort((a, b) => {
    return getFormatPriority(a.name) - getFormatPriority(b.name);
  });

  const results: ConversionResult[] = [];
  let completed = 0;

  for (const file of sortedFiles) {
    try {
      const ext = getFileExtension(file.name);
      const baseName = path.basename(file.name, ext);
      const outputPath = path.join(outputDir, `${baseName}.mp3`);

      await convertAudioToMp3(file.path, outputPath, bitrate);

      results.push({
        inputFile: file.name,
        outputPath,
        success: true,
      });
    } catch (error) {
      results.push({
        inputFile: file.name,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }

    completed++;
    if (onProgress) {
      onProgress(completed, sortedFiles.length);
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

export const convertWavToMp3 = convertAudioToMp3;

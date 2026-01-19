import { app, BrowserWindow, contextBridge, dialog } from "electron";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { ipcMain } from "electron";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import { convertAudioToMp3 } from "../utils/audioConversion.js"; // Changed from convertWavToMp3
import os from "os";
import { promises as fs } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// fix FFMPEG path for packaged app
function getFFmpegPath(): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "ffmpeg");
  } else {
    // in development, use ffmpeg-static path
    return ffmpegPath as unknown as string;
  }
}

const resolvedFFmpegPath = getFFmpegPath();
// @ts-ignore
ffmpeg.setFfmpegPath(resolvedFFmpegPath);
console.log("Using ffmpeg binary at:", resolvedFFmpegPath);

function createMainWindow() {
  console.log("Preload path:", path.join(__dirname, "preload.cjs"));
  const mainWindow = new BrowserWindow({
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
    },
  });
  mainWindow.loadFile(path.join(app.getAppPath(), "dist-react/index.html"));
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
});

app.whenReady().then(() => {
  createMainWindow();
});

ipcMain.handle("dialog:save", async (_, fileName: string) => {
  const result = await dialog.showSaveDialog({
    title: "Save File",
    defaultPath: fileName,
    filters: [{ name: "MP3 Files", extensions: ["mp3"] }],
  });

  return result;
});

ipcMain.handle("dialog:save-zip", async (_, fileName: string) => {
  const result = await dialog.showSaveDialog({
    title: "Save ZIP Archive",
    defaultPath: fileName,
    filters: [{ name: "ZIP Archives", extensions: ["zip"] }],
  });

  return result;
});

// Updated handler name and function call
ipcMain.handle("convert-audio-to-mp3", async (_event, inputPath: string, outputPath: string) => {
  try {
    const result = await convertAudioToMp3(inputPath, outputPath);
    return result;
  } catch (err) {
    console.error("Conversion error:", err);
    throw err;
  }
});

// Keep backward compatibility (optional, but recommended)
ipcMain.handle("convert-wav-to-mp3", async (_event, inputPath: string, outputPath: string) => {
  try {
    const result = await convertAudioToMp3(inputPath, outputPath);
    return result;
  } catch (err) {
    console.error("Conversion error:", err);
    throw err;
  }
});

ipcMain.handle(
  "convert-multiple-files",
  async (_event, files: Array<{ data: ArrayBuffer; name: string }>, bitrate: number = 320) => {
    try {
      const now = new Date();
      const batchId = `${now.getDate().toString().padStart(2, "0")}${(now.getMonth() + 1)
        .toString()
        .padStart(2, "0")}-${now.getHours().toString().padStart(2, "0")}${now
        .getMinutes()
        .toString()
        .padStart(2, "0")}${now.getSeconds().toString().padStart(2, "0")}`;
      const tempDir = path.join(os.tmpdir(), `audio-converter-${batchId}`); // Changed from wav-converter
      const outputDir = path.join(tempDir, "converted");

      await fs.mkdir(tempDir, { recursive: true });
      await fs.mkdir(outputDir, { recursive: true });

      const inputFiles = [];
      for (const file of files) {
        const tempPath = path.join(tempDir, file.name);
        await fs.writeFile(tempPath, Buffer.from(file.data));
        inputFiles.push({ path: tempPath, name: file.name });
      }

      const { convertMultipleFiles } = await import("../utils/audioConversion.js");
      const results = await convertMultipleFiles(inputFiles, outputDir, { bitrate });

      const successfulConversions = results.filter((r) => r.success);

      if (successfulConversions.length === 0) {
        throw new Error("No files were converted successfully");
      }

      if (successfulConversions.length === 1) {
        return {
          type: "single",
          path: successfulConversions[0].outputPath,
          results,
        };
      } else {
        const { createZipFromFiles } = await import("../utils/audioConversion.js");
        const zipPath = path.join(tempDir, `converted-files-${batchId}.zip`);
        const filePaths = successfulConversions
          .map((r) => r.outputPath)
          .filter((path): path is string => path !== undefined);

        await createZipFromFiles(filePaths, zipPath);

        return {
          type: "zip",
          path: zipPath,
          results,
        };
      }
    } catch (err) {
      console.error("Batch conversion error:", err);
      throw err;
    }
  }
);

ipcMain.handle("save-temp-file", async (_, fileData: ArrayBuffer, fileName: string) => {
  const tempDir = os.tmpdir();
  const tempPath = path.join(tempDir, fileName);
  await fs.writeFile(tempPath, Buffer.from(fileData));
  return tempPath;
});

ipcMain.handle("copy-file-to-destination", async (_, sourcePath: string, destinationPath: string) => {
  try {
    await fs.copyFile(sourcePath, destinationPath);
    return destinationPath;
  } catch (err) {
    console.error("File copy error:", err);
    throw err;
  }
});

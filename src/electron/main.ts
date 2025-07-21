import { app, BrowserWindow, contextBridge, dialog } from "electron";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { ipcMain } from "electron";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import { convertWavToMp3 } from "../utils/audioConversion.js";
import os from "os";
import { promises as fs } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

ffmpeg.setFfmpegPath(ffmpegPath as unknown as string);

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

ipcMain.handle("convert-wav-to-mp3", async (_event, inputPath: string, outputPath: string) => {
  try {
    const result = await convertWavToMp3(inputPath, outputPath);
    return result;
  } catch (err) {
    console.error("Conversion error:", err);
    throw err;
  }
});

ipcMain.handle("save-temp-file", async (_, fileData: ArrayBuffer, fileName: string) => {
  const tempDir = os.tmpdir();
  const tempPath = path.join(tempDir, fileName);
  await fs.writeFile(tempPath, Buffer.from(fileData));
  return tempPath;
});

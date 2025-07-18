import { app, BrowserWindow, dialog } from "electron";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { ipcMain } from "electron";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

ffmpeg.setFfmpegPath(ffmpegPath as unknown as string); // check this

function createMainWindow() {
  const mainWindow = new BrowserWindow({});
  mainWindow.loadFile(path.join(app.getAppPath(), "/dist-react/index.html"));
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
});

// pick a save path for files

// handle wav to mp3 conversion using ffmpeg etc

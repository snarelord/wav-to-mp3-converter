import { contextBridge, ipcRenderer } from "electron";

declare global {
  interface Window {
    electronAPI: {
      pickSavePath: (fileName: string) => Promise<string | null>;
      convert: (inputPath: string, outputPath: string) => Promise<string>;
    };
  }
}

console.log("Preload script loaded!");

contextBridge.exposeInMainWorld("electronAPI", {
  pickSavePath: async (fileName: string) => {
    const result = await ipcRenderer.invoke("dialog:save", fileName);
    if (result.canceled) {
      return null;
    }
    return result.filePath;
  },

  convert: async (inputPath: string, outputPath: string): Promise<string> => {
    const result = await ipcRenderer.invoke("convert-wav-to-mp3", inputPath, outputPath);
    return result; // should be outputPath on success
  },

  saveFileTemporarily: async (fileData: ArrayBuffer, fileName: string): Promise<string> => {
    const result = await ipcRenderer.invoke("save-temp-file", fileData, fileName);
    return result;
  },
});

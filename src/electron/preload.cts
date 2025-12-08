import { contextBridge, ipcRenderer } from "electron";

interface ConversionResult {
  success: boolean;
  outputPath: string;
  originalName: string;
  error?: string;
}

interface BatchConversionResult {
  type: "single" | "zip";
  path: string;
  results: ConversionResult[];
}

declare global {
  interface Window {
    electronAPI: {
      pickSavePath: (fileName: string) => Promise<string | null>;
      pickSavePathZip: (fileName: string) => Promise<string | null>;
      convert: (inputPath: string, outputPath: string) => Promise<string>;
      convertMultiple: (
        files: Array<{ data: ArrayBuffer; name: string }>,
        bitrate?: number
      ) => Promise<BatchConversionResult>;
      saveFileTemporarily: (fileData: ArrayBuffer, fileName: string) => Promise<string>;
      copyFileToDestination: (sourcePath: string, destinationPath: string) => Promise<string>;
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

  pickSavePathZip: async (fileName: string) => {
    const result = await ipcRenderer.invoke("dialog:save-zip", fileName);
    if (result.canceled) {
      return null;
    }
    return result.filePath;
  },

  convert: async (inputPath: string, outputPath: string): Promise<string> => {
    const result = await ipcRenderer.invoke("convert-wav-to-mp3", inputPath, outputPath);
    return result; // should be outputPath on success
  },

  convertMultiple: async (
    files: Array<{ data: ArrayBuffer; name: string }>,
    bitrate: number = 320
  ): Promise<BatchConversionResult> => {
    const result = await ipcRenderer.invoke("convert-multiple-files", files, bitrate);
    return result;
  },

  saveFileTemporarily: async (fileData: ArrayBuffer, fileName: string): Promise<string> => {
    const result = await ipcRenderer.invoke("save-temp-file", fileData, fileName);
    return result;
  },

  copyFileToDestination: async (sourcePath: string, destinationPath: string): Promise<string> => {
    const result = await ipcRenderer.invoke("copy-file-to-destination", sourcePath, destinationPath);
    return result;
  },
});

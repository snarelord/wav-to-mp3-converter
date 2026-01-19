import { useState, useEffect } from "react";
import path from "path";
import toast from "react-hot-toast";
import { ConversionOptions, convertWavToMp3 } from "../utils/audioConversion";

export const MAX_FILES = 10;

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
    electronAPI?: {
      saveFileTemporarily(arrayBuffer: ArrayBuffer, name: string): unknown;
      openFileDialog: () => Promise<string[]>;
      pickSavePath: (defaultName: string) => Promise<string | undefined>;
      pickSavePathZip: (defaultName: string) => Promise<string | undefined>;
      convert: (inputPath: string, savePath: string) => Promise<void>;
      convertMultiple: (
        files: Array<{ data: ArrayBuffer; name: string }>,
        bitrate?: number
      ) => Promise<BatchConversionResult>;
      copyFileToDestination: (sourcePath: string, destinationPath: string) => Promise<string>;
    };
  }
}

export const useFileConversion = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [lastConversionSuccess, setLastConversionSuccess] = useState<boolean>(false);
  const [completedCount, setCompletedCount] = useState<number>(0);

  useEffect(() => {
    console.log("electronAPI available:", !!window.electronAPI);
  }, []);

  const handleFilesAdded = (newFiles: File[]) => {
    if (newFiles.length > 0) {
      setLastConversionSuccess(false);
      setCompletedCount(0);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleConvert = async () => {
    if (files.length === 0) {
      toast.error("Please select at least one WAV file to convert.");
      return;
    }

    if (!window.electronAPI?.convertMultiple) {
      toast.error("Electron API not available.");
      return;
    }

    setIsConverting(true);
    setLastConversionSuccess(false);
    setCompletedCount(0);

    try {
      const fileData = await Promise.all(
        files.map(async (file) => ({
          data: await file.arrayBuffer(),
          name: file.name,
        }))
      );

      const batchResult = await window.electronAPI.convertMultiple(fileData, 320);
      const successCount = batchResult.results.filter((r) => r.success).length;

      if (batchResult.type === "single") {
        const savePath = await window.electronAPI.pickSavePath?.(
          batchResult.results[0].originalName.replace(/\.wav$/i, ".mp3")
        );

        if (savePath && window.electronAPI.copyFileToDestination) {
          await window.electronAPI.copyFileToDestination(batchResult.path, savePath);
          toast.success(`File converted and saved to: ${savePath}`);
        }
      } else {
        const zipName = `converted-files-${new Date().toISOString().split("T")[0]}.zip`;
        const savePath = await window.electronAPI.pickSavePathZip?.(zipName);

        if (savePath && window.electronAPI.copyFileToDestination) {
          await window.electronAPI.copyFileToDestination(batchResult.path, savePath);
          toast.success(`${successCount} files converted and saved as ZIP to: ${savePath}`);
        }
      }

      setLastConversionSuccess(true);
      setCompletedCount(successCount);
      setFiles([]);
    } catch (error) {
      console.error("Conversion error:", error);
      toast.error(`Conversion failed: ${error}`);
      setLastConversionSuccess(false);
    } finally {
      setIsConverting(false);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    setFiles([]);
    setLastConversionSuccess(false);
    setCompletedCount(0);
  };

  return {
    files,
    isConverting,
    lastConversionSuccess,
    completedCount,

    handleFilesAdded,
    handleConvert,
    removeFile,
    clearAll,
  };
};

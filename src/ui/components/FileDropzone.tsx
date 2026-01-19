import type React from "react";
import { useState } from "react";
import toast from "react-hot-toast";
import styles from "./FileDropzone.module.css";

interface FileDropzoneProps {
  onFilesAdded: (files: File[]) => void;
  maxFiles: number;
  currentFileCount: number;
  disabled?: boolean;
}

const ACCEPTED_EXTENSIONS = [".wav", ".aif", ".aiff", ".flac", ".m4a", ".aac", ".ogg"];

export default function FileDropzone({
  onFilesAdded,
  maxFiles,
  currentFileCount,
  disabled = false,
}: FileDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  function validateFile(file: File): boolean {
    const extension = file.name.toLowerCase().substring(file.name.lastIndexOf("."));

    if (!ACCEPTED_EXTENSIONS.includes(extension)) {
      toast.error(`${file.name}: Unsupported format. Accepted: ${ACCEPTED_EXTENSIONS.join(", ")}`);
      return false;
    }

    const maxSize = 200 * 1024 * 1024; // 200MB
    if (file.size > maxSize) {
      toast.error(`${file.name}: File too large (max 200MB)`);
      return false;
    }

    return true;
  }

  function validateAndProcessFiles(newFiles: File[]) {
    const validFiles = Array.from(newFiles).filter(validateFile);

    if (validFiles.length === 0) {
      toast.error("No valid audio files found. Please select WAV, FLAC, AIFF, M4A, AAC, or OGG files.");
      return;
    }

    const newTotal = currentFileCount + validFiles.length;
    if (newTotal > maxFiles) {
      const allowedCount = maxFiles - currentFileCount;
      if (allowedCount > 0) {
        toast.error(
          `You can only process up to ${maxFiles} files at once. Adding ${allowedCount} files (${
            validFiles.length - allowedCount
          } files ignored).`
        );
        onFilesAdded(validFiles.slice(0, allowedCount));
      } else {
        toast.error(`You already have ${maxFiles} files selected. Please clear some files before adding more.`);
      }
    } else {
      onFilesAdded(validFiles);
    }
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragOver(false);

    if (disabled) return;

    const droppedFiles = Array.from(event.dataTransfer.files);
    validateAndProcessFiles(droppedFiles);
  }

  function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    if (disabled) return;

    const selectedFiles = Array.from(event.target.files ?? []);
    validateAndProcessFiles(selectedFiles);

    // Clear the input so the same files can be selected again
    event.target.value = "";
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  }

  function handleDragLeave(e: React.DragEvent) {
    // Only reset if leaving the dropzone itself, not child elements
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  }

  return (
    <div
      className={`
        ${styles.dropzone} 
        ${isDragOver ? styles.dropzoneActive : ""} 
        ${disabled ? styles.dropzoneDisabled : ""}
      `}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDragEnd={() => setIsDragOver(false)}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label="Drag and drop audio files here or click to select files"
    >
      <div className={styles.dropzoneContent}>
        <svg className={styles.uploadIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M7 18a4.6 4.4 0 0 1 0 -9h0a5 4.5 0 0 1 11 2h1a3.5 3.5 0 0 1 0 7h-1" />
          <polyline points="9 15 12 12 15 15" />
          <line x1="12" y1="12" x2="12" y2="21" />
        </svg>

        <p className={styles.dropzoneTitle}>Drag and drop your audio files here</p>

        <p className={styles.dropzoneDivider}>or</p>

        <label className={`${styles.fileInputLabel} ${disabled ? styles.fileInputLabelDisabled : ""}`}>
          <input
            className={styles.fileInput}
            type="file"
            accept=".wav,.aif,.aiff,.flac,.m4a,.aac,.ogg"
            multiple
            onChange={handleFileSelect}
            disabled={disabled}
          />
          Choose Files
        </label>

        <p className={styles.fileLimitText}>Maximum {maxFiles} files at once</p>
        <p className={styles.formatText}>Supports: WAV, FLAC, AIFF, M4A, AAC, OGG</p>
      </div>
    </div>
  );
}

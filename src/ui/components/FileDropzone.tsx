import type React from "react";
import { useState } from "react";
import styles from "./FileDropzone.module.css";

interface FileDropzoneProps {
  onFilesAdded: (files: File[]) => void;
  maxFiles: number;
  currentFileCount: number;
  disabled?: boolean;
}

const FileDropzone: React.FC<FileDropzoneProps> = ({ onFilesAdded, maxFiles, currentFileCount, disabled = false }) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const validateAndProcessFiles = (newFiles: File[]) => {
    const wavFiles = Array.from(newFiles).filter((file) => file.name.toLowerCase().endsWith(".wav"));

    if (wavFiles.length === 0) {
      alert("Please select only WAV files.");
      return;
    }

    const newTotal = currentFileCount + wavFiles.length;
    if (newTotal > maxFiles) {
      const allowedCount = maxFiles - currentFileCount;
      if (allowedCount > 0) {
        alert(
          `You can only process up to ${maxFiles} files at once. Adding ${allowedCount} files (${
            wavFiles.length - allowedCount
          } files ignored).`
        );
        onFilesAdded(wavFiles.slice(0, allowedCount));
      } else {
        alert(`You already have ${maxFiles} files selected. Please clear some files before adding more.`);
      }
    } else {
      onFilesAdded(wavFiles);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);

    if (disabled) return;

    const droppedFiles = Array.from(event.dataTransfer.files);
    validateAndProcessFiles(droppedFiles);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;

    const selectedFiles = Array.from(event.target.files ?? []);
    validateAndProcessFiles(selectedFiles);

    // Clear the input so the same files can be selected again
    event.target.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only reset if leaving the dropzone itself, not child elements
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

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
      aria-label="Drag and drop WAV files here or click to select files"
    >
      <div className={styles.dropzoneContent}>
        <svg className={styles.uploadIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M7 18a4.6 4.4 0 0 1 0 -9h0a5 4.5 0 0 1 11 2h1a3.5 3.5 0 0 1 0 7h-1" />
          <polyline points="9 15 12 12 15 15" />
          <line x1="12" y1="12" x2="12" y2="21" />
        </svg>

        <p className={styles.dropzoneTitle}>Drag and drop your WAV files here</p>

        <p className={styles.dropzoneDivider}>or</p>

        <label className={`${styles.fileInputLabel} ${disabled ? styles.fileInputLabelDisabled : ""}`}>
          <input
            className={styles.fileInput}
            type="file"
            accept=".wav"
            multiple
            onChange={handleFileSelect}
            disabled={disabled}
          />
          Choose Files
        </label>

        <p className={styles.fileLimitText}>Maximum {maxFiles} files at once</p>
      </div>
    </div>
  );
};

export default FileDropzone;

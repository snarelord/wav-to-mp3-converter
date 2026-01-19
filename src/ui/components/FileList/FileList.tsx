import React from "react";
import styles from "./FileList.module.css";
import ConversionControls from "../ConversionControls/ConversionControls";

interface FileListProps {
  files: File[];
  maxFiles: number;
  isConverting: boolean;
  lastConversionSuccess: boolean;
  completedCount: number;
  onClearAll: () => void;
  onConvert: () => void;
  onRemoveFile: (index: number) => void;
}

export default function FileList({
  files,
  maxFiles,
  isConverting,
  lastConversionSuccess,
  completedCount,
  onClearAll,
  onConvert,
  onRemoveFile,
}: FileListProps) {
  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  if (files.length === 0) {
    return null;
  }

  return (
    <div className={styles.fileList}>
      <div className={styles.fileListHeader}>
        <h3 className={`${styles.fileListTitle} ${files.length >= maxFiles * 0.8 ? styles.approachingLimit : ""}`}>
          {files.length} of {maxFiles} {files.length === 1 ? "file(s)" : "files"} selected
          {lastConversionSuccess && <span className={styles.completedBadge}>✓ {completedCount} completed</span>}
          {files.length >= maxFiles && <span className={styles.limitReached}>⚠️ Limit reached</span>}
        </h3>
        <ConversionControls onClearAll={onClearAll} onConvert={onConvert} isConverting={isConverting} />
      </div>

      <div className={styles.fileCards}>
        {files.map((file, i) => (
          <div key={i} className={styles.fileCard}>
            <div className={styles.fileCardContent}>
              <div className={styles.fileIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18V5l12-2v13" />
                  <circle cx="6" cy="18" r="3" />
                  <circle cx="18" cy="16" r="3" />
                </svg>
              </div>
              <div className={styles.fileDetails}>
                <span className={styles.fileName}>{file.name}</span>
                <span className={styles.fileSize}>{formatFileSize(file.size)}</span>
              </div>
            </div>
            <button
              className={styles.removeButton}
              onClick={() => onRemoveFile(i)}
              disabled={isConverting}
              aria-label="Remove file"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {files.length > 1 && (
        <div className={styles.batchNote}>
          <svg className={styles.batchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <span>Multiple files will be packaged as a ZIP archive</span>
        </div>
      )}
    </div>
  );
}

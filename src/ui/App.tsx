import type React from "react";
import styles from "./App.module.css";
import FileDropzone from "./components/FileDropzone";
import FileList from "./components/FileList/FileList";
import { useFileConversion, MAX_FILES } from "../hooks/useFileConversion";

const App: React.FC = () => {
  const {
    files,
    isConverting,
    lastConversionSuccess,
    completedCount,
    handleFilesAdded,
    handleConvert,
    removeFile,
    clearAll,
  } = useFileConversion();

  return (
    <div className={styles.app}>
      <div className={styles.header}>
        <h1 className={styles.title}>WAV to MP3 Converter</h1>
        <p className={styles.subtitle}>Convert your WAV files to MP3 at 320kbps</p>
      </div>

      <FileDropzone
        onFilesAdded={handleFilesAdded}
        maxFiles={MAX_FILES}
        currentFileCount={files.length}
        disabled={isConverting}
      />

      <FileList
        files={files}
        maxFiles={MAX_FILES}
        isConverting={isConverting}
        lastConversionSuccess={lastConversionSuccess}
        completedCount={completedCount}
        onClearAll={clearAll}
        onConvert={handleConvert}
        onRemoveFile={removeFile}
      />
    </div>
  );
};

export default App;

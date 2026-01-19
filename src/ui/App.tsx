import styles from "./App.module.css";
import FileDropzone from "./components/FileDropzone";
import FileList from "./components/FileList/FileList";
import { useFileConversion, MAX_FILES } from "../hooks/useFileConversion";
import { Toaster } from "react-hot-toast";

export default function App() {
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
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 5000,
          style: {
            background: "#363636",
            color: "#fff",
          },
          success: {
            duration: 5000,
            iconTheme: {
              primary: "#4ade80",
              secondary: "#fff",
            },
          },
          error: {
            duration: 6000,
            iconTheme: {
              primary: "#ef4444",
              secondary: "#fff",
            },
          },
        }}
      />
      <div className={styles.header}>
        <h1 className={styles.title}>MP3 Converter</h1>
        <p className={styles.subtitle}>Convert audio files to MP3 at 320kbps</p>
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
}

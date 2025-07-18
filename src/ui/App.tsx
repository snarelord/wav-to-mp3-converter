import React, { useState } from "react";
import styles from "./App.module.css";

declare global {
  interface Window {
    electronAPI?: {
      openFileDialog: () => Promise<string[]>;
      pickSavePath: (defaultName: string) => Promise<string | undefined>;
      convert: (inputPath: string, savePath: string) => Promise<void>;
    };
  }
}

const App: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const droppedFiles = Array.from(event.dataTransfer.files).filter((file) => file.name.endsWith(".wav"));
    setFiles(droppedFiles);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? []).filter((file) => file.name.endsWith(".wav"));
    setFiles(selectedFiles);
  };

  const handleConvert = async () => {
    if (files.length === 0) {
      alert("Please select at least one WAV file to convert.");
      return;
    }

    const results = await Promise.allSettled(
      files.map(async (file) => {
        const inputPath = file.path;

        const savePath = await window.electronAPI?.pickSavePath(file.name);
        if (!savePath) {
          throw new Error("Save path is required.");
        }
        return await window.electronAPI?.convert(inputPath, savePath);
      })
    );

    const summary = results.map((res, i) => {
      if (res.status === "fulfilled") return `${files[i].name} converted successfully`;
      else return `${files[i].name} failed: ${res.reason}`;
    });

    alert(summary.join("\n"));
  };

  // use effect for status updates success/failure messages

  return (
    <div className={styles.app}>
      <h1 className={styles.title}>WAV to MP3 Converter</h1>

      <div className={styles.dropzone} onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}>
        <p>Drag and drop your WAV files here</p>
        <p>or</p>
        <input className={styles.fileInput} type="file" accept=".wav" multiple onChange={handleFileSelect} />
      </div>

      {files.length > 0 && (
        <div className={styles.fileList}>
          <h3>Files selected:</h3>
          <ul>
            {files.map((file, i) => (
              <li key={i}>
                {file.name} <button onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}>❌</button>
              </li>
            ))}
          </ul>
          <button className={styles.convertButton} onClick={handleConvert}>
            Convert to MP3
          </button>
        </div>
      )}
      {/* <button onClick={() => console.log("button clicked")}>Button</button> */}
    </div>
  );
};

export default App;

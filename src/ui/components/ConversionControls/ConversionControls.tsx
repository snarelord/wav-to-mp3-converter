import React from "react";
import styles from "./ConversionControls.module.css";
import toast from "react-hot-toast";

interface ConversionControlsProps {
  onClearAll: () => void;
  onConvert: () => void;
  isConverting: boolean;
}

export default function ConversionControls({ onClearAll, onConvert, isConverting }: ConversionControlsProps) {
  function handleClear() {
    onClearAll();
    toast.success("Cleared files");
  }

  return (
    <div className={styles.buttonGroup}>
      <button className={styles.clearButton} onClick={handleClear} disabled={isConverting}>
        Clear All
      </button>
      <button
        className={`${styles.convertButton} ${isConverting ? styles.converting : ""}`}
        onClick={onConvert}
        disabled={isConverting}
      >
        {isConverting ? "Converting..." : "Convert to MP3"}
      </button>
    </div>
  );
}

import React from "react";
import styles from "./ConversionControls.module.css";

interface ConversionControlsProps {
  onClearAll: () => void;
  onConvert: () => void;
  isConverting: boolean;
}

const ConversionControls: React.FC<ConversionControlsProps> = ({ onClearAll, onConvert, isConverting }) => {
  return (
    <div className={styles.buttonGroup}>
      <button className={styles.clearButton} onClick={onClearAll} disabled={isConverting}>
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
};

export default ConversionControls;

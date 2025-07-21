import ffmpeg from "fluent-ffmpeg";
import path from "path";

function isWavFile(wavFilename: string) {
  const ext = path.extname(wavFilename);
  return ext === ".wav";
}

export function convertWavToMp3(wavFilename: string, outputPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!isWavFile(wavFilename)) {
      return reject(new Error("Not a WAV file"));
    }

    ffmpeg(wavFilename)
      .audioBitrate(320)
      .format("mp3")
      .on("error", (err) => reject(err))
      .on("end", () => resolve(outputPath))
      .save(outputPath);
  });
}

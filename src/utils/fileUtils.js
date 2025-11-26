/**
 * Generate a timestamp string for file naming
 * Format: YYYYMMDD_HHMMSS
 * Example: 20250126_091244
 */
export const getTimestamp = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  return `${year}${month}${day}_${hours}${minutes}${seconds}`;
};

/**
 * Generate a filename with timestamp
 * @param {string} baseName - The base name without extension (e.g., "compressed", "merged")
 * @param {string} extension - The file extension with dot (e.g., ".pdf")
 * @returns {string} Filename with timestamp (e.g., "compressed_20250126_091244.pdf")
 */
export const getTimestampedFilename = (baseName, extension = ".pdf") => {
  return `${baseName}_${getTimestamp()}${extension}`;
};

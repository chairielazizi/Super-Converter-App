import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";

/**
 * Downloads a PDF file with cross-platform support
 * - Browser: Uses proper download attribute (must be user-triggered)
 * - Mobile: Saves to device storage using Capacitor Filesystem
 */
export const downloadPdf = async (pdfBytes, filename) => {
  const blob = new Blob([pdfBytes], { type: "application/pdf" });

  // Check if we're on mobile
  const isNative = Capacitor.isNativePlatform();
  console.log("Platform check - isNative:", isNative);

  if (isNative) {
    // ANDROID/IOS: Use Capacitor Filesystem
    try {
      const base64 = await blobToBase64(blob);
      console.log("Attempting to save file:", filename);

      // Try Documents directory first
      try {
        const result = await Filesystem.writeFile({
          path: filename,
          data: base64,
          directory: Directory.Documents,
        });

        console.log("✅ File saved successfully to Documents:", result.uri);
        alert(
          `✅ PDF saved!\n\nLocation: Documents/${filename}\n\nCheck your file manager app.`
        );
        return {
          success: true,
          message: `Saved to Documents/${filename}`,
          uri: result.uri,
        };
      } catch (docError) {
        console.error("Documents directory failed:", docError);

        // Fallback to Data directory
        const result = await Filesystem.writeFile({
          path: filename,
          data: base64,
          directory: Directory.Data,
        });

        console.log("✅ File saved to Data directory:", result.uri);
        alert(`✅ PDF saved!\n\nLocation: App Data/${filename}`);
        return {
          success: true,
          message: `Saved to App Data/${filename}`,
          uri: result.uri,
        };
      }
    } catch (error) {
      console.error("❌ Filesystem write failed:", error);
      alert(
        `❌ Failed to save PDF\n\nError: ${error.message}\n\nTry:\n1. Check app permissions\n2. Ensure storage is available`
      );
      return { success: false, message: `Error: ${error.message}` };
    }
  } else {
    // BROWSER: Must be triggered by user action for download attribute to work
    // Create blob URL and return it - the UI will use it in an <a> tag
    const url = URL.createObjectURL(blob);
    console.log("Browser: Created blob URL for download:", url);

    return {
      success: true,
      message: "Click the download button below",
      uri: url,
      filename: filename,
      isBrowser: true,
    };
  }
};

/**
 * FOR BROWSER: Must be called from a user click event
 * This separate function ensures the download works properly
 */
export const triggerBrowserDownload = (url, filename) => {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();

  // Cleanup after a delay
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

// Helper to convert blob to base64
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

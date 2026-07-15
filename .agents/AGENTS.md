# Project Context: Super Converter App

## Overview
Super Converter App is a multi-tool web application built with React, Vite, and Capacitor (for Android builds). It provides a variety of PDF manipulation tools, document conversion, and video downloading capabilities.

## Architecture & Technology Stack
- **Framework**: React 19 + Vite
- **Mobile Support**: Capacitor (@capacitor/android, @capacitor/core, @capacitor/filesystem)
- **Styling**: Vanilla CSS (`index.css`, `App.css`), with specific styled-components-like inline `<style>` tags in components.
- **Routing**: `react-router-dom`
- **PDF Manipulation**: `pdf-lib` for editing, `react-pdf` for viewing.
- **Icons**: `lucide-react`
- **File Uploading**: `react-dropzone` via custom `FileUploader` component.
- **Design Aesthetic**: Modern, dark theme with neon accents (`var(--primary-color)`, `var(--accent-color)`), glassmorphism, and smooth micro-animations.

## Important Notes
- The Android build requires Android Studio and the Android SDK to compile locally. The project already has `@capacitor/android` configured, so running `npx cap sync android` and `npx cap open android` works when the SDK is available.
- Tools are mostly located in `src/pages/pdf-tools/`. Each tool should follow the established UI patterns (neon headers, `.tool-content` container, `FileUploader`, preview section with iframe/react-pdf, and download/result sections).
- Shared utilities: `src/utils/downloadHelper.js`, `src/utils/fileUtils.js`.

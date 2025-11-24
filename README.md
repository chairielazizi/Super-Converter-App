# Super Converter App

A sleek, neon-themed mobile application for PDF editing, document conversion, and video downloading.

## Android SDK Requirements

To build and run this application on Android, you need to set up your development environment:

1.  **Download Android Studio**: [https://developer.android.com/studio](https://developer.android.com/studio)
    - Install the latest stable version.
2.  **Install SDK Platforms**:
    - Open Android Studio -> SDK Manager.
    - Install **Android 10 (API Level 29)** or higher (Android 14 / API 34 is recommended).
3.  **Install SDK Tools**:
    - Android SDK Build-Tools
    - Android SDK Command-line Tools
    - Android Emulator
    - Android SDK Platform-Tools

## Getting Started

1.  **Install Dependencies**:

    ```bash
    npm install
    ```

2.  **Run Web Development Server**:

    ```bash
    npm run dev
    ```

3.  **Build for Android**:
    ```bash
    npm run build
    npx cap add android
    npx cap open android
    ```

import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import PdfEditor from "./pages/PdfEditor";
import Converter from "./pages/Converter";
import VideoDownloader from "./pages/VideoDownloader";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="pdf-editor" element={<PdfEditor />} />
          <Route path="converter" element={<Converter />} />
          <Route path="video-downloader" element={<VideoDownloader />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

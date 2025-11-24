import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import PdfEditor from "./pages/PdfEditor";
import Converter from "./pages/Converter";
import VideoDownloader from "./pages/VideoDownloader";

// PDF Tools
import {
  MergePdf,
  SplitPdf,
  CompressPdf,
  RotatePdf,
  DeletePages,
  ExtractPages,
  OrganizePdf,
  PdfAnnotator,
  PdfReader,
  NumberPages,
  CropPdf,
  RedactPdf,
  WatermarkPdf,
  PdfFormFiller,
  SharePdf,
  EditPdf,
  PdfConverter,
  SignPdf,
  UnlockPdf,
  ProtectPdf,
  FlattenPdf,
  PdfScanner,
} from "./pages/pdf-tools";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="pdf-editor" element={<PdfEditor />} />

          {/* PDF Tool Routes */}
          <Route path="pdf-editor/merge" element={<MergePdf />} />
          <Route path="pdf-editor/split" element={<SplitPdf />} />
          <Route path="pdf-editor/compress" element={<CompressPdf />} />
          <Route path="pdf-editor/rotate" element={<RotatePdf />} />
          <Route path="pdf-editor/delete-pages" element={<DeletePages />} />
          <Route path="pdf-editor/extract" element={<ExtractPages />} />
          <Route path="pdf-editor/organize" element={<OrganizePdf />} />
          <Route path="pdf-editor/annotate" element={<PdfAnnotator />} />
          <Route path="pdf-editor/reader" element={<PdfReader />} />
          <Route path="pdf-editor/number-pages" element={<NumberPages />} />
          <Route path="pdf-editor/crop" element={<CropPdf />} />
          <Route path="pdf-editor/redact" element={<RedactPdf />} />
          <Route path="pdf-editor/watermark" element={<WatermarkPdf />} />
          <Route path="pdf-editor/form-filler" element={<PdfFormFiller />} />
          <Route path="pdf-editor/share" element={<SharePdf />} />
          <Route path="pdf-editor/edit" element={<EditPdf />} />
          <Route path="pdf-editor/converter" element={<PdfConverter />} />
          <Route path="pdf-editor/sign" element={<SignPdf />} />
          <Route path="pdf-editor/unlock" element={<UnlockPdf />} />
          <Route path="pdf-editor/protect" element={<ProtectPdf />} />
          <Route path="pdf-editor/flatten" element={<FlattenPdf />} />
          <Route path="pdf-editor/scanner" element={<PdfScanner />} />

          <Route path="converter" element={<Converter />} />
          <Route path="video-downloader" element={<VideoDownloader />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

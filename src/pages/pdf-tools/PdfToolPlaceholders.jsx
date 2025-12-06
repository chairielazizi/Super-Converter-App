import React from "react";
import PdfToolPlaceholder from "./PdfToolPlaceholder";
import {
  Trash2,
  FileOutput,
  FolderOpen,
  PenTool,
  Eye,
  Hash,
  Crop,
  EyeOff,
  Droplet,
  FolderEdit,
  Share2,
  FileType,
  Edit3,
  Lock,
  Unlock,
  Shield,
  FileDown,
  Camera,
} from "lucide-react";

// Organize Tools
export const DeletePages = () => (
  <PdfToolPlaceholder
    title="Delete PDF Pages"
    description="Remove unwanted pages"
    icon={Trash2}
  />
);

export const ExtractPages = () => (
  <PdfToolPlaceholder
    title="Extract PDF Pages"
    description="Extract specific pages"
    icon={FileOutput}
  />
);

export const OrganizePdf = () => (
  <PdfToolPlaceholder
    title="Organize PDF"
    description="Reorder pages"
    icon={FolderOpen}
  />
);

// View & Edit Tools
export const PdfAnnotator = () => (
  <PdfToolPlaceholder
    title="PDF Annotator"
    description="Add annotations"
    icon={PenTool}
  />
);

export const PdfReader = () => (
  <PdfToolPlaceholder
    title="PDF Reader"
    description="View PDF files"
    icon={Eye}
  />
);

export const NumberPages = () => (
  <PdfToolPlaceholder
    title="Number Pages"
    description="Add page numbers"
    icon={Hash}
  />
);

export const CropPdf = () => (
  <PdfToolPlaceholder
    title="Crop PDF"
    description="Crop PDF pages"
    icon={Crop}
  />
);

export const RedactPdf = () => (
  <PdfToolPlaceholder
    title="Redact PDF"
    description="Remove sensitive info"
    icon={EyeOff}
  />
);

export const WatermarkPdf = () => (
  <PdfToolPlaceholder
    title="Watermark PDF"
    description="Add watermarks"
    icon={Droplet}
  />
);

export const PdfFormFiller = () => (
  <PdfToolPlaceholder
    title="PDF Form Filler"
    description="Fill PDF forms"
    icon={FolderEdit}
  />
);

export const SharePdf = () => (
  <PdfToolPlaceholder
    title="Share PDF"
    description="Share via link"
    icon={Share2}
  />
);

export const EditPdf = () => (
  <PdfToolPlaceholder
    title="Edit PDF"
    description="Edit PDF content"
    icon={Edit3}
  />
);

// Convert & Sign
export const PdfConverter = () => (
  <PdfToolPlaceholder
    title="PDF Converter"
    description="Convert to other formats"
    icon={FileType}
  />
);

export const PdfScanner = () => (
  <PdfToolPlaceholder
    title="PDF Scanner"
    description="Scan documents to PDF"
    icon={Camera}
  />
);

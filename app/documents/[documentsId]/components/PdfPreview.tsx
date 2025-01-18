import React from "react";
import { Worker, Viewer } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";

const PdfPreview = ({ fileUrl }: { fileUrl: string }) => {
    return (
        <div style={{ height: "100vh", width: "100%" }}>
            <Worker workerUrl={`https://unpkg.com/pdfjs-dist@2.15.349/build/pdf.worker.min.js`}>
                <Viewer fileUrl={fileUrl} />
            </Worker>
        </div>
    );
};

export default PdfPreview;

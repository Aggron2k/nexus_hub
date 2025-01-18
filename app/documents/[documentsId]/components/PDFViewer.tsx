"use client";

import dynamic from "next/dynamic";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";

import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";

// A Worker és Viewer dinamikus importja SSR nélkül
const Worker = dynamic(() => import("@react-pdf-viewer/core").then((mod) => mod.Worker), { ssr: false });
const Viewer = dynamic(() => import("@react-pdf-viewer/core").then((mod) => mod.Viewer), { ssr: false });

const PDFViewer: React.FC = () => {
    const pdfURL = "https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf"; // A PDF fájl URL-je

    // A default layout plugin példányosítása
    const defaultLayoutPluginInstance = defaultLayoutPlugin();

    return (
        <div className="border p-4 rounded-md">
            <h2 className="text-xl font-bold mb-4">PDF Preview</h2>
            <div className="border rounded overflow-hidden h-[700px]">
                {/* A Worker beállítása */}
                <Worker workerUrl="https://cdn.jsdelivr.net/npm/pdfjs-dist@2.16.105/build/pdf.worker.min.js">
                    <Viewer fileUrl={pdfURL} plugins={[defaultLayoutPluginInstance]} />
                </Worker>
            </div>
        </div>
    );
};

export default PDFViewer;

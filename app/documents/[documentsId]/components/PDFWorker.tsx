import '@react-pdf-viewer/core/lib/styles/index.css';
import { Worker } from '@react-pdf-viewer/core';

const PDFWorker = () => (
    <Worker workerUrl="https://cdn.jsdelivr.net/npm/pdfjs-dist@2.16.105/build/pdf.worker.min.js" />
);

export default PDFWorker;

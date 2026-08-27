import { useEffect, useRef, useState } from "react";
import useLanguageStore, { t } from "../../hooks/useLanguageStore";
import { BlobProvider, type DocumentProps } from "@react-pdf/renderer";
import {
    Document as PDFDocument,
    Page as PDFPage,
    pdfjs,
} from "react-pdf";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
).toString();

interface Props {
    document: React.ReactElement<DocumentProps>;
}


function ReportViewer({ document }: Props) {
    const { l } = useLanguageStore();

    return (
        <BlobProvider document={document}>
            {({ url, loading, error }) => {
                if (loading) return <p>{l(t.report.viewer.generating)}</p>;
                if (error || !url) return <p>{l(t.report.viewer.error)}</p>;

                return <ReportPreview url={url} />;
            }}
        </BlobProvider>
    )
}

export default ReportViewer;








function ReportPreview({ url }: { url: string }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState(0);
    const [numPages, setNumPages] = useState(0);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const observer = new ResizeObserver(([entry]) => {
            setWidth(entry.contentRect.width);
        });
        observer.observe(container);

        return () => observer.disconnect();
    }, []);

    return (
        <div ref={containerRef} className="reportViewer">
            {width > 0 && (
                <PDFDocument file={url} onLoadSuccess={(pdf: { numPages: number }) => setNumPages(pdf.numPages)}>
                    {Array.from({ length: numPages }, (_, index) => (
                        <PDFPage
                            key={index}
                            pageNumber={index + 1}
                            width={width}
                            renderTextLayer={true}
                            renderAnnotationLayer={false}
                        />
                    ))}
                </PDFDocument>
            )}
        </div>
    );
}
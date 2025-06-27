import { useEffect, useState } from "react";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Download from "@mui/icons-material/Download";
import CloseIcon from "@mui/icons-material/Close";

const style = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    boxShadow: 24,
    p: 4,
    borderRadius: "8px",
    maxHeight: '90vh',
    overflow: 'auto'
};

export default function VideoPlayer({ open, onClose, src }) {
    const [showDownload, setShowDownload] = useState(false)
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [isDownloading, setIsDownloading] = useState(false);

    useEffect(() => {
        const handleEsc = (event) => {
            if (event.keyCode === 27) {
                onClose();
            }
        };
        window.addEventListener("keydown", handleEsc);
        return () => {
            window.removeEventListener("keydown", handleEsc);
        };
    }, [onClose]);

    const handleDownload = async (e) => {
        try {
            e.stopPropagation();
            setIsDownloading(true);
            setDownloadProgress(0);

            // Fetch directly from CloudFront URL
            const response = await fetch(src);
            if (!response.ok) {
                throw new Error('Download failed');
            }

            const reader = response.body.getReader();
            const contentLength = +response.headers.get('Content-Length');

            let receivedLength = 0;
            const chunks = [];

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                chunks.push(value);
                receivedLength += value.length;

                // Update progress percentage
                setDownloadProgress(Math.round((receivedLength / contentLength) * 100));
            }

            const blob = new Blob(chunks);
            const blobUrl = window.URL.createObjectURL(blob);

            // Extract filename from URL or use default
            let filename = src.split('/').pop();
            if (!filename.match(/\.mp4$/)) {
                filename = `${filename}.mp4`;
            }

            // Create and trigger download
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Cleanup
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error('Download failed:', error);
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <Modal open={open} onClose={onClose} aria-labelledby="upload-modal-title">
            <Box sx={style} className="w-full max-w-3xl blueBackground px-16">
                <IconButton
                    style={{ position: "absolute", top: 10, right: 10, color: '#fff' }}
                    onClick={onClose}
                >
                    <CloseIcon />
                </IconButton>
                <div className="flex flex-col gap-2 items-center relative mt-6" >
                    <video src={src} autoPlay controls style={{ height: '100%', width: '100%' }} />
                    <button
                        disabled={isDownloading}
                        className={`align-center gap-2 !bg-black opacity-70 px-2 py-1 absolute top-2 right-2 dark-blue-color rounded flex items-center justify-center text-lg rounded-lg`}
                        onClick={handleDownload}
                    >
                        <Download sx={{ color: 'primary.contrastText' }} fontSize="medium" />
                        <p className={`${isDownloading ? 'block' : 'hidden'}`}>{downloadProgress}%</p>
                    </button>
                </div>
            </Box>
        </Modal>
    );
};

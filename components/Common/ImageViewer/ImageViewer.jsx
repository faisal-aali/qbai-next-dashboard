
import { useEffect, useState } from "react";
import { Box, Button, Grid, IconButton, Modal, Typography } from "@mui/material";
import { ArrowBack, ArrowBackIos, ArrowForward, ArrowForwardIos, ArrowRight, Close, ZoomIn, ZoomOut } from "@mui/icons-material";

const containerStyle = {
    width: 'auto',
    height: '100vh',
    width: '100vw',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
}

export default function ImageViewer({ images }) {
    const [showImgIdx, setShowImgIdx] = useState()

    // useEffect(() => {
    //     const handleEsc = (event) => {
    //         if (event.keyCode === 27) {
    //             setShowImgIdx();
    //         }
    //     };
    //     window.addEventListener("keydown", handleEsc);
    //     return () => {
    //         window.removeEventListener("keydown", handleEsc);
    //     };
    // }, []);

    const nextImage = (e) => {
        e.stopPropagation()
        setShowImgIdx((prevIndex) => (prevIndex + 1) % images.length);
    };

    const prevImage = (e) => {
        e.stopPropagation()
        setShowImgIdx((prevIndex) => (prevIndex - 1 + images.length) % images.length);
    };

    return (
        <Grid container gap={1}>
            {images.map((url, i) => (
                <Grid item onClick={() => setShowImgIdx(i)} style={{ cursor: 'pointer' }}>
                    <img src={url} width={100} height={75} style={{ border: '1px solid rgba(52, 64, 84, 0.7)', borderRadius: 5 }} />
                </Grid>
            ))}
            <Modal open={showImgIdx === undefined ? false : true} onClose={() => setShowImgIdx()}>
                <Box padding={2} sx={containerStyle} onClick={() => setShowImgIdx()}>
                    <Box sx={{ height: '100%', display: 'flex', justifyContent: 'center', position: 'relative' }}>
                        <img onClick={(e) => e.stopPropagation()} src={images[showImgIdx]} style={{ objectFit: 'contain', height: '100%' }} />
                        <IconButton onClick={() => setShowImgIdx()} size="small" sx={{ position: 'absolute', top: 30, right: 30, color: '#fff', border: '1px solid rgba(50, 225, 0, 1)' }}><Close /></IconButton>
                        <IconButton onClick={nextImage} disableRipple sx={{ display: images.length > 1 ? 'flex' : 'none', position: 'absolute', color: 'primary.dark', right: '2%', top: '50%' }}><ArrowForward sx={{ fontSize: 64 }} /></IconButton>
                        <IconButton onClick={prevImage} disableRipple sx={{ display: images.length > 1 ? 'flex' : 'none', position: 'absolute', color: 'primary.dark', left: '2%', top: '50%' }}><ArrowBack sx={{ fontSize: 64 }} /></IconButton>
                    </Box>
                </Box>
            </Modal>
        </Grid>
    );
}

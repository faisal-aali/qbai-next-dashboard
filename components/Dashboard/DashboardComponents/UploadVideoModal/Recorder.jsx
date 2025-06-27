import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import { useEffect, useState } from 'react';
import { useRecordWebcam } from 'react-record-webcam';

export default function Recorder({ onSubmit }) {
    const {
        activeRecordings,
        cancelRecording,
        clearAllRecordings,
        clearError,
        clearPreview,
        closeCamera,
        createRecording,
        devicesById,
        devicesByType,
        download,
        errorMessage,
        muteRecording,
        openCamera,
        pauseRecording,
        resumeRecording,
        startRecording,
        stopRecording,
    } = useRecordWebcam({
        mediaTrackConstraints: { video: true, audio: false, frameRate: 120 }
    });

    const [videoDeviceId, setVideoDeviceId] = useState('');

    useEffect(() => {
        return () => {
            clearAllRecordings()
        }
    }, [])

    useEffect(() => {
        setVideoDeviceId(devicesByType?.video[0].deviceId || '')
    }, [devicesByType])

    const quickDemo = async () => {
        try {
            const recording = await createRecording();
            if (!recording) return;
            await openCamera(recording.id);
            await startRecording(recording.id);
            await new Promise((resolve) => setTimeout(resolve, 3000));
            await stopRecording(recording.id);
            await closeCamera(recording.id);
        } catch (error) {
            console.log({ error });
        }
    };

    const start = async () => {
        const recording = await createRecording(videoDeviceId);
        if (recording) await openCamera(recording.id);
    };

    const handleSubmit = (blob) => {
        clearAllRecordings()
        onSubmit(blob)
    }

    return (
        <div className="flex flex-1 flex-col gap-4 text-white">
            <h1 className="text-3xl font-bold">Record Your Video</h1>
            <div className={`flex flex-col gap-4 justify-center ${activeRecordings.length > 0 && 'hidden'}`}>
                <div className="flex flex-col gap-4">
                    <h4>Select input device:</h4>
                    <TextField size='small' select value={videoDeviceId} onChange={(e) => setVideoDeviceId(e.target.value)}>
                        {(devicesByType?.video || []).map((device) =>
                            <MenuItem value={device.deviceId}>
                                {device.label}
                            </MenuItem>
                        )}
                    </TextField>
                </div>
                <div>
                    <Button variant='contained' className='bg-primary' onClick={start}>Open camera</Button>
                    {/* <Button onClick={() => clearAllRecordings()}>Clear all</Button>
                <Button onClick={() => clearError()}>Clear error</Button> */}
                </div>
            </div>
            <div className={`my-2 ${!errorMessage && 'hidden'}`}>
                <p>{`Error: ${errorMessage}`}</p>
            </div>
            <div className="grid grid-cols-custom gap-4">
                {activeRecordings?.map((recording) => (
                    <div className="bg-blueBackground rounded-lg" key={recording.id}>
                        <div className="text-white grid grid-cols-1">
                            <p>Live</p>
                            <small>Status: {recording.status}</small>
                            <small>Video: {recording.videoLabel}</small>
                            <small>Audio: {recording.audioLabel}</small>
                        </div>
                        <div className={`${recording.previewRef.current?.src.startsWith('blob:') ? 'hidden' : 'visible'}`}>
                            <video ref={recording.webcamRef} loop autoPlay playsInline style={{ maxHeight: 500 }} />
                            <div className="space-x-1 space-y-1 my-2">
                                <Button
                                    // inverted
                                    disabled={recording.status === 'RECORDING' || recording.status === 'PAUSED'}
                                    onClick={() => startRecording(recording.id)}
                                >
                                    {recording.status === 'RECORDING' ? 'Recording...' : recording.status === 'PAUSED' ? 'Paused' : 'Record'}
                                </Button>
                                <Button
                                    // inverted
                                    disabled={recording.status !== 'RECORDING' && recording.status !== 'PAUSED'}
                                    // toggled={recording.status === 'PAUSED'}
                                    onClick={() => recording.status === 'PAUSED' ? resumeRecording(recording.id) : pauseRecording(recording.id)}
                                >
                                    {recording.status === 'PAUSED' ? 'Resume' : 'Pause'}
                                </Button>
                                {/* <Button
                                    inverted
                                    toggled={recording.isMuted}
                                    onClick={() => muteRecording(recording.id)}
                                >
                                    Mute
                                </Button> */}
                                <Button
                                    // inverted 
                                    disabled={recording.status !== 'RECORDING' && recording.status !== 'PAUSED'}
                                    onClick={() => {
                                        stopRecording(recording.id)
                                        // closeCamera(recording.id)
                                    }}>
                                    Stop
                                </Button>
                                <Button
                                    // inverted 
                                    onClick={() => cancelRecording(recording.id)}>
                                    Cancel
                                </Button>
                            </div>

                        </div>
                        <div
                            className={`${recording.previewRef.current?.src.startsWith('blob:')
                                ? 'visible'
                                : 'hidden'
                                }`}
                        >
                            <p>Preview</p>
                            <video ref={recording.previewRef} autoPlay loop playsInline style={{ maxHeight: 500 }} onLoadedMetadata={() => {
                                if (recording.previewRef.current) {
                                    recording.previewRef.current.playbackRate = 0.5; // Set playback rate to slow-motion
                                }
                            }} />
                            <div className="space-x-2 my-2">
                                <Button variant='contained' inverted onClick={() => handleSubmit(recording.blob)}>
                                    Submit
                                </Button>
                                <Button inverted onClick={() => clearPreview(recording.id)}>
                                    Try Again
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

import { useState } from "react";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import CloseIcon from "@mui/icons-material/Close";
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import { CircularProgress, Grid, InputAdornment, styled, Tooltip, useTheme } from "@mui/material";
import { useApp } from "@/components/Context/AppContext";

const VisuallyHiddenInput = styled('input')({
    clip: 'rect(0 0 0 0)',
    clipPath: 'inset(50%)',
    height: 1,
    overflow: 'hidden',
    position: 'absolute',
    bottom: 0,
    left: 0,
    whiteSpace: 'nowrap',
    width: 1,
});

const TicketMessageField = ({ onSubmit, submitting, indicateError = false, placeholder = 'Add description', setMessage, message, setAttachments, attachments, maxRows = 4, minRows = 2 }) => {
    const { showSnackbar } = useApp();
    const theme = useTheme()

    const [error, setError] = useState(false)

    const handleAddFiles = (e) => {
        Array.from(e.target.files).forEach(selectedFile => {
            if (selectedFile && selectedFile.type.startsWith("image/")) {
                const reader = new FileReader();
                reader.readAsDataURL(selectedFile);
                reader.onload = (event) => {
                    setAttachments(v => v.concat({
                        file: selectedFile,
                        data: event.target.result
                    }));
                };
            } else {
                showSnackbar("Please upload a valid image file.", "error");
            }
        })
    };

    return (
        <Grid container gap={2}>
            <Grid item container gap={1} display={attachments.length > 0 ? 'flex' : 'none'}>
                {attachments.map((file, i) => (
                    <Grid item style={{ position: 'relative' }}>
                        <img src={file.data} width={100} height={75} style={{ border: '1px solid rgba(52, 64, 84, 0.7)', borderRadius: 5 }} />
                        <CloseIcon color="disabled" onClick={() => setAttachments(v => v.filter((_, ii) => ii !== i))} fontSize="small" style={{ position: 'absolute', right: 5, top: 5, cursor: 'pointer' }} />
                    </Grid>
                ))}
            </Grid>
            <Grid item container alignItems={'center'} gap={1.5}>
                <Grid item>
                    <IconButton component='label'>
                        <img src="/assets/icons/attach-icon.svg" alt="paperclip" />
                        <VisuallyHiddenInput
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleAddFiles} />
                    </IconButton>
                </Grid>
                <Grid item xs>
                    <TextField
                        fullWidth
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        placeholder={placeholder}
                        multiline
                        minRows={minRows}
                        maxRows={maxRows}
                        sx={{
                            '& .MuiInputBase-input': {
                                color: theme.palette.primary.main
                            },
                            '& .MuiInputBase-input::placeholder': {
                                color: 'rgba(137, 147, 158, 0.5)',
                                opacity: 1
                            }
                        }}
                        error={indicateError && error}
                        color="primary"
                        onBlur={() => setError(message.length === 0)}
                        InputProps={{
                            sx: {
                                paddingRight: 4,
                                bgcolor: 'rgba(52, 64, 84, 0.7)'
                            },
                            endAdornment: onSubmit && (
                                <InputAdornment position="end">
                                    <IconButton onClick={onSubmit} disabled={submitting} component='label' sx={{ color: 'rgba(137, 147, 158, 1)', position: 'absolute', right: 0 }}>
                                        {submitting ? <CircularProgress size={20} color="primary" /> : <img src="/assets/icons/send-icon.svg" alt="send" />}
                                    </IconButton>
                                </InputAdornment>
                            )
                        }}
                    />
                    {/* <Tooltip title='Attach screenshot'>
                    <IconButton component='label' sx={{ color: 'rgba(137, 147, 158, 1)', position: 'absolute', right: 0 }}>
                        <ImageOutlinedIcon />
                        <VisuallyHiddenInput
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleAddFiles} />
                    </IconButton>
                </Tooltip> */}
                </Grid>
            </Grid>
        </Grid>
    );
};

export default TicketMessageField;

import { Grid, Typography } from "@mui/material";
import ImageViewer from "../ImageViewer/ImageViewer";
import { useEffect } from "react";
import { Circle } from "@mui/icons-material";

export default function TicketMessageCard({ message, ticket, unreadMessageIds }) {

    useEffect(() => {
        console.log(message)
    }, [message])

    if (!message) return <Typography color={'error'}>Could not load message</Typography>

    return (
        <Grid item container flexDirection={'column'} gap={1} bgcolor={'rgba(2, 7, 22, 1)'} borderRadius={3} padding={2} border={'1px solid rgba(52, 64, 84, 0.7)'}>
            <Grid item container justifyContent={'space-between'}>
                <Grid item>
                    <Typography color={'primary'} fontSize={16}>
                        {message.user.name}
                    </Typography>
                </Grid>
                <Grid item container xs='auto' alignItems={'center'} gap={1}>
                    <Grid item>
                        <Typography color={'rgba(137, 147, 158, 1)'} fontSize={14}>
                            {new Date(message.creationDate).toLocaleString('en-US')}
                        </Typography>
                    </Grid>
                    <Grid item display={unreadMessageIds.includes(message._id) ? 'flex' : 'none'}>
                        <Circle sx={{ color: 'rgba(50, 225, 0, 1)', fontSize: 8 }} />
                    </Grid>
                </Grid>
            </Grid>
            <Grid item display={message.user.role === 'admin' ? 'none' : 'flex'}>
                <Typography fontSize={12} textTransform={'capitalize'}>
                    Platform: {ticket.platform}
                </Typography>
            </Grid>
            <Grid item>
                <Typography fontSize={14} sx={{ whiteSpace: 'pre-wrap' }}>
                    {message.message}
                </Typography>
            </Grid>
            <Grid item>
                <ImageViewer images={message.attachments} />
            </Grid>
        </Grid>
    )
}
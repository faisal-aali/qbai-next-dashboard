import { useState, useEffect, useMemo } from "react";
import { Grid, Box, Typography, Checkbox, TextField, Slider, MenuItem, Tooltip } from "@mui/material";

const MetricSlider = ({ criterion, metrics, setMetrics }) => {
    const [value, setValue] = useState(metrics[criterion._id]?.value || criterion.range[0]);

    const criterionId = criterion._id;
    const metricValue = useMemo(() => metrics[criterionId]?.value || criterion.range[0], [metrics]);

    useEffect(() => {
        setValue(metricValue);
    }, [metricValue]);

    const handleMetricsChange = (field, value) => {
        setMetrics(prev => ({
            ...prev,
            [criterion._id]: {
                ...prev[criterion._id],
                [field]: value
            }
        }));
    };

    return (
        <Grid container key={criterion._id} columnGap={2} justifyContent={'space-between'} flexDirection={{ xs: 'column', md: 'row' }}>
            <Grid item container xs={'auto'} display={'flex'} flexDirection={'row'} alignItems={'center'} gap={2}>
                <Grid item>
                    <Checkbox
                        checked={metrics[criterion._id]?.selected || false}
                        onChange={(e) => handleMetricsChange('selected', e.target.checked)}
                        sx={{ padding: 0 }}
                    />
                </Grid>
                <Grid item sx={{ width: 180 }}>
                    <Typography id={`criterion-name-${criterion._id}`} gutterBottom sx={{ margin: 0, display: 'inline' }}>
                        {criterion.name}
                    </Typography>
                </Grid>
            </Grid>
            <Grid item container xs={true} justifyContent={'center'} display={'flex'} gap={2} sx={{ cursor: !metrics[criterion._id]?.selected ? 'not-allowed' : 'auto' }}>
                <Grid item display={'flex'} alignItems={'center'}>
                    <Typography variant="body2">
                        {criterion.range[0]}
                    </Typography>
                </Grid>
                <Grid item xs={true}>
                    <Slider
                        disabled={!metrics[criterion._id]?.selected}
                        value={value}
                        onChange={(_, newValue) => setValue(newValue)}
                        onChangeCommitted={() => handleMetricsChange('value', value)}
                        aria-labelledby={`range-slider-${criterion._id}`}
                        min={criterion.range[0]}
                        max={criterion.range[1]}
                        sx={{
                            '& .MuiSlider-thumb': {
                                width: 12,
                                height: 12,
                            },
                            '& .MuiSlider-track': {
                                backgroundColor: '#32E100',
                                border: 'none !important',
                            },
                            '& .MuiSlider-rail': {
                                backgroundColor: '#32e10087',
                            },
                        }}
                    />
                </Grid>
                <Grid item display={'flex'} alignItems={'center'}>
                    <Typography variant="body2">
                        {criterion.range[1]}
                    </Typography>
                </Grid>
            </Grid>
            <Grid item container xs='auto' justifyContent={'center'} display={'flex'} gap={1}>
                <Grid item>
                    <TextField
                        value={value}
                        disabled={!metrics[criterion._id]?.selected}
                        onChange={(e) => {
                            setValue(Number(e.target.value))
                            handleMetricsChange('value', Number(e.target.value))
                        }}
                        onFocus={(e) => e.target.select()}
                        type="number"
                        inputProps={{
                            min: criterion.range[0],
                            max: criterion.range[1],
                            style: {
                                cursor: !metrics[criterion._id]?.selected ? 'not-allowed' : 'auto',
                            }
                        }}
                        sx={{
                            width: 60,
                            height: '100%',
                            "& .MuiInputBase-input": {
                                padding: '5px',
                                color: '#89939E',
                                textAlign: 'center',
                                fontWeight: 400,
                                fontSize: '14px',
                            },
                        }}
                    />
                </Grid>
                <Grid item>
                    <TextField
                        select
                        value={metrics[criterion._id]?.op || 'above'}
                        onChange={(e) => handleMetricsChange('op', e.target.value)}
                        sx={{
                            height: '100%',
                            "& .MuiInputBase-input": {
                                color: '#89939E',
                                fontSize: '14px',
                                paddingY: '5px'
                            }
                        }}
                    >
                        <MenuItem value="above">Above</MenuItem>
                        <MenuItem value="below">Below</MenuItem>
                    </TextField>
                </Grid>
            </Grid>
        </Grid >
    )
}

const MetricsSelector = ({ criteria, metrics, setMetrics }) => {

    if (!criteria) return null;

    return (
        <Box sx={{
            height: { xs: 300, md: 400 },
            overflowY: 'auto',
        }}>
            <Grid container gap={1} flexDirection={'column'}>
                {criteria.map((criterion, index) => (
                    <Grid item key={index}>
                        <MetricSlider
                            criterion={criterion}
                            metrics={metrics}
                            setMetrics={setMetrics}
                        />
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};

export default MetricsSelector;
'use client';
import { createTheme } from '@mui/material/styles';
import KeyboardArrowDown from '@mui/icons-material/KeyboardArrowDown';

const theme = createTheme({
    palette: {
        primary: {
            main: '#32E100',
            contrastText: 'white'
        },
        background: {
            paper: '#090F21',
        },
        success: {
            main: '#32E100',
        },
        error: {
            main: '#F52323',
        },
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: '5px',
                    ":disabled": {
                        backgroundColor: '#BCBCBC80',
                        color: 'white'
                    }
                },
                contained: {
                    backgroundColor: 'rgb(50, 225, 0)',
                    color: '#020716',
                    ':hover': {
                        backgroundColor: 'rgb(50, 225, 0)',
                        color: '#020716',
                    }
                },
                outlined: {
                    // backgroundColor: 'white',
                    color: 'rgb(50, 225, 0)',
                    borderColor: 'rgb(50, 225, 0)',
                    ':hover': {
                        // backgroundColor: 'white',
                        color: 'rgb(50, 225, 0)',
                        borderColor: 'rgb(50, 225, 0)',
                    }
                }
            },
            defaultProps: {
                disableElevation: true,
                disableRipple: true,
            }
        },
        MuiCheckbox: {
            styleOverrides: {
                root: {
                    color: '#ffffff45',
                    '&.Mui-disabled': {
                        color: '#ffffff30'
                    }
                },
            }
        },
        MuiSelect: {
            defaultProps: {
                IconComponent: KeyboardArrowDown, // Set your custom icon component here
            },
        },
        MuiFilledInput: {
            styleOverrides: {
                root: {
                    '&:before, &:after': {
                        display: 'none', // Remove the animated indicator
                    },
                },

            },
        },
    }
});

export default theme;
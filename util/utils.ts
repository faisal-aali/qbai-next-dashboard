const defaultValues = {
    supportedVideoExtensions: ['ogm', 'wmv', 'mpg', 'webm', 'ogv', 'mov', 'asx', 'mpeg', 'mp4', 'm4v', 'avi']
}

const convertCmToFeetAndInches = (cm: number) => {
    if (!cm) return { feet: "", inches: "", string: "N/A" };
    const num = cm / 2.54;
    const feet = Math.floor(num / 12);
    const inches = Math.round(num % 12);
    return {
        feet,
        inches,
        string: `${feet} ft ${inches} in`
    };
};

const convertFeetAndInchesToCm = (feet: number, inches: number) => {
    return (feet * 30.48 + inches * 2.54) || null
}

const convertCmToInches = (cm: number) => {
    return cm / 2.54 || null
}

const convertDoBToAge = (dob: string) => {
    if (!dob) return ''
    // Convert the input string to a Date object
    const birthDate = new Date(dob);
    const today = new Date();

    // Calculate the difference in years
    let age = today.getFullYear() - birthDate.getFullYear();

    // Adjust the age if the birthday hasn't occurred yet this year
    const monthDifference = today.getMonth() - birthDate.getMonth();
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    return age;
}

function generateYoutubeEmbedUrl(url: string) {
    const regex = /(?:youtube\.com\/(?:.*v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    const videoId = match ? match[1] : null;
    return `https://www.youtube.com/embed/${videoId}`;
}

function convertVimeoUrlToEmbed(url: string) {
    const path = url.split('?')[0];
    const arr = path.split('/')
    const hash = arr[4];
    const id = arr[3];
    return `https://player.vimeo.com/video/${id || hash}?h=${hash}`
}

function convertMsToRelativeTime(ms: number) {
    const pluralize = (value: number, unit: string) => `${value} ${unit}${value !== 1 ? 's' : ''}`;

    const days = Math.floor(ms / (24 * 60 * 60 * 1000));
    ms %= 24 * 60 * 60 * 1000;

    const hours = Math.floor(ms / (60 * 60 * 1000));
    ms %= 60 * 60 * 1000;

    const minutes = Math.floor(ms / (60 * 1000));

    const dayStr = days > 0 ? pluralize(days, 'day') : '';
    const hourStr = hours > 0 ? pluralize(hours, 'hour') : '';
    const minuteStr = minutes > 0 ? pluralize(minutes, 'minute') : '';

    return [dayStr, hourStr, minuteStr].filter(Boolean).join(', ');
}

function formatLocation(city?: string, state?: string, country?: string): string {
    const formattedLocation = [
        city?.trim(),
        state?.trim(),
        country?.trim()
    ].filter(Boolean)
        .join(', ');

    return formattedLocation || "";
}

function getFileExtension(fileName: string) {
    const parts = fileName.split('.');
    if (parts && parts.length > 1) {
        return parts.pop()?.toLowerCase();  // Get the extension and convert to lowercase
    }
    return '';  // Return empty string if there's no extension
}

const sanitizeFileName = (filename: string) => {
    return filename
        .replace(/[^\w\s.-]/g, '')  // Remove special characters except dot and hyphen
        .replace(/\s+/g, '-');      // Replace spaces with hyphen
};

const getRandomizedArray = (array: any[], size: number) => {
    return array.sort(() => Math.random() - 0.5).slice(0, size);
}

const getCloudFrontUrl = (url?: string) => {
    if (!url) return null

    // const key = url.split('/').pop()
    const key = url.split('amazonaws.com/')[1]

    return `https://d1j9mo3a5mx49t.cloudfront.net/${key}`
}

export {
    convertCmToFeetAndInches,
    convertFeetAndInchesToCm,
    generateYoutubeEmbedUrl,
    convertDoBToAge,
    convertVimeoUrlToEmbed,
    convertMsToRelativeTime,
    formatLocation,
    getFileExtension,
    sanitizeFileName,
    defaultValues,
    getRandomizedArray,
    convertCmToInches,
    getCloudFrontUrl
}
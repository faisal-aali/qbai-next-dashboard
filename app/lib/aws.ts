
import AWS from 'aws-sdk';

const AWS_BUCKET = process.env.AWS_BUCKET || ''
// Configure the AWS SDK with your credentials and the region
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
});

const s3 = new AWS.S3();



const uploadFileToS3 = (file: Buffer | Uint8Array | Blob | string, name: string | undefined, isBase64: number, randomizeName = true, bucket?: string, contentType?: 'video/mp4' | 'application/json' | 'application/pdf' | 'image/jpeg' | 'image/png'): Promise<string> => {
    return new Promise(async (resolve, reject) => {
        let fileBody;

        if (isBase64 && typeof file === 'string') {
            console.log('parsing as base64 encoded')
            const base64Data = file.replace(/^data:.+;base64,/, '');
            fileBody = Buffer.from(base64Data, 'base64');
        } else if (file instanceof Blob) {
            const arrayBuffer = await file.arrayBuffer();
            fileBody = Buffer.from(arrayBuffer);
        } else {
            fileBody = file;
        }

        let fileName = name
        if (randomizeName) {
            fileName = `${crypto.randomUUID()}${(name && `.${name.split('.').pop()}`) || ''}`
        }

        if (!fileName) {
            throw new Error('File name is required')
        }
        
        s3.upload({
            Bucket: bucket || AWS_BUCKET,
            Key: fileName,
            Body: fileBody,
            ContentType: contentType
        }, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data.Location);
            }
        });
    });
};

export {
    uploadFileToS3
}
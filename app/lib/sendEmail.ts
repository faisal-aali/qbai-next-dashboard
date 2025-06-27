import { createTransport, TransportOptions } from "nodemailer";
import { google } from 'googleapis';

const CLIENT_ID = process.env.GMAIL_CLIENT_ID;
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.GMAIL_REFRESH_TOKEN;
const REDIRECT_URIS = process.env.GMAIL_REDIRECT_URIS;

const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URIS);
oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string; }) {
    return new Promise(async (resolve, reject) => {
        const accessToken = await oAuth2Client.getAccessToken();

        const transporter = createTransport({
            service: 'gmail',
            auth: {
                type: 'OAuth2',
                user: 'no-reply@qbai.com',
                clientId: CLIENT_ID,
                clientSecret: CLIENT_SECRET,
                refreshToken: REFRESH_TOKEN,
                accessToken: accessToken.token,
            },
        } as TransportOptions);

        const mailOptions = {
            from: `Spin Lab AI <no-reply@qbai.com>`,
            to,
            subject: subject,
            html: html
        }

        transporter.sendMail(mailOptions).then(() => {
            resolve('Email has been sent')
        }).catch(reject)
    })
}

export {
    sendEmail
}
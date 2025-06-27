import crypto from 'crypto'

interface Iotp {
    code: number,
    id: string
}

let otps: Array<Iotp> = []

function generateOtp(id: string) {
    const code = Math.floor(100000 + Math.random() * 900000)
    otps.push({
        id,
        code
    })
    setTimeout(() => {
        console.log('otp code', code, 'has been expired')
        otps = otps.filter(_otp => _otp.code !== code)
    }, 900000);
    // console.log('generateOtp', otps)
    return code
}

function verifyOtp(code: number, remove = true) {
    // console.log('verifyotp', otps)
    const otp = otps.find(_otp => _otp.code === code)
    if (!otp) return null

    if (remove) otps = otps.filter(_otp => _otp.code !== otp.code)
    return otp
}


export {
    generateOtp,
    verifyOtp
}
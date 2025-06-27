import { MongooseError } from 'mongoose'
import * as Yup from 'yup'
import Stripe from "stripe";
import { IVideo } from './interfaces/video';
import { ICredit, IUser } from './interfaces/user';
import { IPurchase } from './interfaces/purchase';
import { Drill, Purchase, RecommendationCriteria, User, Video } from './models';
import mongoose from './mongodb';
import crypto from 'crypto'
import ffmpeg from 'fluent-ffmpeg';
import { PassThrough } from 'stream';
import { JsonWebTokenError } from 'jsonwebtoken';
import { IDrillRecommendationCriteria } from './interfaces/drill';
import axios from 'axios';

function validateError(err: any) {
    if (err instanceof Yup.ValidationError) {
        return { message: err.message, status: 400 }
    }
    if (err instanceof SyntaxError) {
        return { message: err.message, status: 400 }
    }
    if (err instanceof MongooseError) {
        return { message: err.message, status: 400 }
    }
    if (err instanceof Stripe.errors.StripeCardError) {
        return { message: err.message, status: 400 }
    }
    if (err instanceof JsonWebTokenError) {
        return { message: 'Invalid JWT token', status: 400 }
    }
    return { message: err?.message || 'Error occured', status: 500 }
}

function calculateCredits(userId: string): Promise<ICredit> {
    return new Promise(async (resolve, reject) => {
        try {
            // console.log(user)
            const user = await User.findOne({ _id: userId })
            if (!user) return reject('User not found')

            var playerIds = [userId]
            if (['trainer', 'staff'].includes(user.role)) {
                const players = await User.find({ 'roleData.trainerId': user._id })
                playerIds = players.map(p => p._id.toString())
                // console.log('playerIds', playerIds)
            }

            const videos = await Video.find({ userId: { $in: playerIds } }, { _id: 1, uploadedBy: 1, "assessmentDetails.statusCode": 1 })
            const purchases = await Purchase.find({ userId: userId })
            var credits = {
                purchased: 0,
                used: 0,
                remaining: 0
            };
            purchases.forEach(purchase => {
                if ((purchase.isForfeited && purchase.forfeitOn && (new Date(purchase.forfeitOn).getTime() < new Date().getTime())) || new Date(purchase.activateAfter).getTime() > new Date().getTime())
                    return
                credits.purchased += purchase.credits
            })
            videos.forEach(video => {
                if (video.uploadedBy?.toString() === userId?.toString()) {
                    if ([undefined, 'InProgress', 'Completed'].includes(video.assessmentDetails?.statusCode))
                        credits.used += 1
                }
            })
            credits.remaining = credits.purchased - credits.used
            // console.log('calculateCredits', credits)
            return resolve(credits)
        } catch (err) {
            reject(err)
        }
    })
}

async function extractVideoFramerate(video: File | string, isBase64: Number): Promise<number> {
    return new Promise(async (resolve, reject) => {
        try {
            console.log('isBase64', isBase64)
            // Convert the file to a buffer
            const videoBuffer = isBase64 ? Buffer.from(video as string, 'base64') : Buffer.from(await (video as File).arrayBuffer());

            // Create a PassThrough stream from the buffer
            const stream = new PassThrough();
            stream.end(videoBuffer);

            // Extract video metadata and calculate the framerate
            ffmpeg(stream)
                .ffprobe((err, metadata) => {
                    if (err) {
                        console.error('Error reading video metadata:', err);
                        throw new Error('Error: Unable to read video metadata')
                    }

                    const videoStream = metadata.streams.find((stream) => stream.codec_type === 'video');

                    if (!videoStream) throw new Error('Error: No video stream found')
                    if (!videoStream.avg_frame_rate) throw new Error('Error: Failed to determine fps')
                    return resolve(eval(videoStream.avg_frame_rate))
                    // videoStream.frame
                    // const frameCount = videoStream.nb_frames ? parseInt(videoStream.nb_frames, 10) : null;
                    // const duration = videoStream.duration ? parseFloat(videoStream.duration) : null;

                    // if (frameCount && duration) {
                    //     const calculatedFramerate = frameCount / duration;
                    //     console.log(`Calculated Framerate: ${calculatedFramerate} fps`);

                    //     // Respond with the calculated framerate
                    //     Promise.resolve(calculatedFramerate)
                    // } else {
                    //     throw new Error('Unable to determine framerate')
                    // }
                });
        } catch (err) {
            return reject(err)
        }
    })
}

async function validateDrillRecommendationCriteria(criteria: IDrillRecommendationCriteria[]) {
    const recommendationCriterias = await RecommendationCriteria.find()
    for (const item of criteria) {
        const referencedCriteria = recommendationCriterias.find(criteria => criteria._id.toString() === item.refId)
        if (!referencedCriteria) return { valid: false, message: `Invalid refId '${item.refId}' in recommendation criteria` }
        if (item.value < referencedCriteria.range[0] || item.value > referencedCriteria.range[1]) return { valid: false, message: `Invalid value '${item.value}' for recommendation criteria '${item.refId}'` }
    }
    return { valid: true }
}

function getDynamicPropery(obj: any, property: string) {
    try {
        const properties = property.split('.')
        let value = obj
        for (const prop of properties) {
            value = value[prop]
        }
        return value
    } catch {
        return undefined
    }
}

async function getRecommendedDrills(userId: string) {
    // validate user
    const user = await User.findOne({ _id: userId })
    if (!user) throw new Error('User does not exist')

    // fetch recent 3 processed videos
    const recentVideos = await Video.find({ userId: userId, 'assessmentDetails.statusCode': "Completed" }, {}, { sort: { creationDate: -1 }, limit: 3 })

    if (recentVideos.length === 0) return []

    // fetch drills
    const drills = await Drill.find({ recommendationCriteria: { $ne: null } })

    // fetch recommendation criteria
    const recommendationCriterias = await RecommendationCriteria.find()

    // validate drills
    const recommendedDrills = drills.map(drill => {
        const criteria = drill.recommendationCriteria
        if (!criteria) throw new Error('Drill has no recommendation criteria')

        const metCriteria: { refId: string, description: string }[] = []

        criteria.forEach(drillCriteria => {
            const referencedCriteria = recommendationCriterias.find(criteria => criteria._id.toString() === drillCriteria.refId)
            if (!referencedCriteria) throw new Error(`Invalid refId '${drillCriteria.refId}' in recommendation criteria`)
            if (recentVideos.some(video => {
                if (referencedCriteria.calculationType === 'absolute') {
                    if (!referencedCriteria.attribute) throw new Error(`Attribute is required for absolute calculation type in recommendation criteria`)
                    const videoMetric = getDynamicPropery(video.assessmentDetails.stats, referencedCriteria.attribute)
                    console.log(referencedCriteria.attribute, videoMetric, drillCriteria.op, drillCriteria.value)
                    if (videoMetric) {
                        if (drillCriteria.op === 'above') {
                            const compare = videoMetric > drillCriteria.value
                            if (compare) metCriteria.push({ refId: drillCriteria.refId, description: `${referencedCriteria.name} is above ${drillCriteria.value} (${videoMetric})` })
                            return compare
                        }
                        if (drillCriteria.op === 'below') {
                            const compare = videoMetric < drillCriteria.value
                            if (compare) metCriteria.push({ refId: drillCriteria.refId, description: `${referencedCriteria.name} is below ${drillCriteria.value} (${videoMetric})` })
                            return compare
                        }
                    }
                } else if (referencedCriteria.calculationType === 'custom_knee_flexion_delta') {
                    const knee_flexion_fp = video.assessmentDetails.stats.metrics.knee_flexion_fp
                    const knee_flexion_br = video.assessmentDetails.stats.metrics.knee_flexion_br
                    const knee_flexion_delta = knee_flexion_fp - knee_flexion_br;
                    console.log('knee_flexion_delta', knee_flexion_fp, knee_flexion_br, knee_flexion_delta)
                    if (drillCriteria.op === 'above') {
                        const compare = knee_flexion_delta > drillCriteria.value
                        if (compare) metCriteria.push({ refId: drillCriteria.refId, description: `${referencedCriteria.name} is above ${drillCriteria.value} (${knee_flexion_delta})` })
                        return compare
                    }
                    if (drillCriteria.op === 'below') {
                        const compare = knee_flexion_delta < drillCriteria.value
                        if (compare) metCriteria.push({ refId: drillCriteria.refId, description: `${referencedCriteria.name} is below ${drillCriteria.value} (${knee_flexion_delta})` })
                        return compare
                    }
                } else {
                    throw new Error(`Invalid calculation type '${referencedCriteria.calculationType}' in recommendation criteria`)
                }
                // the video metric does not meet criteria
                return false
            })) {
                // the criteria is met
                return true
            } else {
                // the criteria does not meet
                return false
            }
        })

        if (metCriteria.length > 0) {
            // recommend this drill as at least one criteria is met
            return {
                ...drill.toObject(),
                metCriteria
            }
        } else {
            // do not recommend this drill as all criteria are not met
            return undefined
        }
    }).filter(v => v !== undefined)

    console.log('recommendedDrills', recommendedDrills)

    return recommendedDrills
}

async function srcUrlToBase64(srcUrl: string) {
    const response = await axios.get(srcUrl, { responseType: 'arraybuffer' })
    return Buffer.from(response.data).toString('base64')
}

/**
 * Escapes special characters in an email address for use in regex patterns
 * @param email The email address to escape
 * @returns The escaped email address
 */
export const escapeEmailForRegex = (email: string): string => {
    return email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

export {
    validateError,
    calculateCredits,
    extractVideoFramerate,
    validateDrillRecommendationCriteria,
    getRecommendedDrills,
    srcUrlToBase64
}
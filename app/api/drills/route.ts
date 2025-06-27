import { NextRequest, NextResponse } from "next/server";
import { Category, Drill, RecommendationCriteria, Subscription } from "@/app/lib/models";
import * as Yup from 'yup'
import { validateDrillRecommendationCriteria, validateError } from "@/app/lib/functions";
import { authOption } from "../auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import axios from 'axios'
import { headers } from "next/headers";
import jwt from 'jsonwebtoken'
import { IUser } from "@/app/lib/interfaces/user";
import { IDrillRecommendationCriteria } from "@/app/lib/interfaces/drill";
import microserviceAPI from "@/app/lib/microservice";
import { extractVimeoId } from "@/app/lib/utils/video";


export async function GET(req: NextRequest) {
    try {
        var session;
        const authHeader = headers().get("authorization")
        if (authHeader) {
            const user = jwt.verify(authHeader.split('Bearer ')[1], process.env.NEXTAUTH_SECRET as string) as Partial<IUser>;
            if (!user._id) throw Error('Malformed JWT');
            session = { user };
        } else {
            session = await getServerSession(authOption);
        }
        if (!session || !session.user || !session.user.role) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id')

        const query: { _id?: string } = {};

        if (id) query._id = id;

        const drills = await Drill.find(query)

        const subscription = await Subscription.findOne({ userId: session.user._id, currentPeriodEnd: { $gt: new Date() } }, {}, { sort: { creationDate: -1 } })

        for (const drill of drills) {
            if (!drill.isFree)
                if (['player', 'trainer'].includes(session.user.role))
                    if (!subscription)
                        drill.videoLink = ''
        }

        return NextResponse.json(drills)
    } catch (err: unknown) {
        console.error(err)
        const obj = validateError(err)
        return NextResponse.json({ message: obj.message }, { status: obj.status })
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOption);
        if (!session || !session.user || session.user.role !== 'admin') return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

        const data = await req.json()

        const schema = Yup.object({
            categoryId: Yup.string().required("Category Id is required"),
            videoLink: Yup.string().required("Video Link is required"),
            title: Yup.string().required("Title is required"),
            description: Yup.string().required("Description is required"),
            isFree: Yup.boolean().required("isFree is required"),
            recommendationCriteria: Yup.array().min(1).of(Yup.object({
                refId: Yup.string().required("recommendationCriteria[].refId is required"),
                value: Yup.number().required("recommendationCriteria[].value is required"),
                op: Yup.string().oneOf(['above', 'below']).required("recommendationCriteria[].op is required")
            })).optional().nullable()
        });

        await schema.validate(data)

        const category = await Category.findOne({ _id: data.categoryId })
        if (!category) return NextResponse.json({ message: 'Invalid category Id' }, { status: 400 });

        if (data.recommendationCriteria) {
            const { valid, message } = await validateDrillRecommendationCriteria(data.recommendationCriteria)
            if (!valid) return NextResponse.json({ message }, { status: 400 })
        }

        var thumbnailUrl = null;
        let videoTranscription = null;
        let videoEmbedding = null;
        
        if (data.videoLink.match('vimeo')) {
            // Get thumbnail
            thumbnailUrl = await axios.get(`https://vimeo.com/api/oembed.json?url=${data.videoLink}`)
                .then(res => res.data.thumbnail_url)
                .catch(err => {
                    console.error(err)
                    return null
                })
            
            // Get transcription and embedding
            const vimeoId = extractVimeoId(data.videoLink);
            if (vimeoId) {
                try {
                    const { transcriptionText, embedding } = await microserviceAPI.getVimeoTranscription(vimeoId);
                    videoTranscription = transcriptionText;
                    videoEmbedding = embedding;
                } catch (error) {
                    console.error('Error getting video transcription/embedding:', error);
                    videoTranscription = null;
                    videoEmbedding = null;
                }
            }
        }

        const drill = await Drill.create({
            userId: session.user._id,
            categoryId: data.categoryId,
            videoLink: data.videoLink,
            title: data.title,
            description: data.description,
            isFree: data.isFree,
            thumbnailUrl: thumbnailUrl,
            videoTranscription: videoTranscription,
            videoEmbedding: videoEmbedding,
            recommendationCriteria: data.recommendationCriteria || null
        })

        console.log("drill got ",drill)

        return NextResponse.json({ message: `Drill has been created with id ${drill._id}` }, { status: 200 })
    } catch (err: unknown) {
        console.error(err)
        const obj = validateError(err)
        return NextResponse.json({ message: obj.message }, { status: obj.status })
    }
}
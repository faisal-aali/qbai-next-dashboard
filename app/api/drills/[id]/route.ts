import { NextRequest, NextResponse } from "next/server";
import { Category, Drill } from "@/app/lib/models";
import * as Yup from 'yup'
import { validateError, validateDrillRecommendationCriteria } from "@/app/lib/functions";
import { getServerSession } from "next-auth";
import { authOption } from "../../auth/[...nextauth]/route";
import axios from 'axios';
import microserviceAPI from "@/app/lib/microservice";
import { extractVimeoId } from "@/app/lib/utils/video";


export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOption);
        if (!session || !session.user || session.user.role !== 'admin') return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

        const { pathname } = new URL(req.url);
        const id = pathname.split('/').pop(); // /api/drills/:id
        if (!id) return NextResponse.json({ message: 'id is required' }, { status: 400 })

        const drill = await Drill.findOne({ _id: id })
        if (!drill) return NextResponse.json({ message: 'Invalid drill Id' }, { status: 404 });

        const data = await req.json()

        const schema = Yup.object({
            categoryId: Yup.string().optional(),
            videoLink: Yup.string().optional(),
            title: Yup.string().optional(),
            description: Yup.string().optional(),
            isFree: Yup.boolean().optional(),
            recommendationCriteria: Yup.array().min(1).of(Yup.object({
                refId: Yup.string().required("recommendationCriteria[].refId is required"),
                value: Yup.number().required("recommendationCriteria[].value is required"),
                op: Yup.string().oneOf(['above', 'below']).required("recommendationCriteria[].op is required")
            })).optional().nullable()
        });

        await schema.validate(data)

        if (Object.keys(data).length == 0) return NextResponse.json({ message: 'BAD REQUEST' }, { status: 400 })

        if (data.categoryId) {
            const category = await Category.findOne({ _id: data.categoryId })
            if (!category) return NextResponse.json({ message: 'Invalid category Id' }, { status: 400 });
        }

        if (data.recommendationCriteria) {
            const { valid, message } = await validateDrillRecommendationCriteria(data.recommendationCriteria)
            if (!valid) return NextResponse.json({ message }, { status: 400 })
        }

        // Handle video transcription for Vimeo videos
        let videoTranscription = data.videoTranscription;
        let videoEmbedding = data.videoEmbedding;
        let thumbnailUrl: string | null = drill.thumbnailUrl || null;



        console.log("got video trans",videoTranscription)
        console.log("videoEmbedding",videoEmbedding)

        // Check if videoLink is being updated
        if (data.videoLink && data.videoLink !== drill.videoLink) {
            if (data.videoLink.match('vimeo')) {
                // Get new thumbnail
                thumbnailUrl = await axios.get(`https://vimeo.com/api/oembed.json?url=${data.videoLink}`)
                    .then(res => res.data.thumbnail_url)
                    .catch(err => {
                        console.error(err)
                        return null
                    });
                // Get new transcription and embedding using the MicroserviceAPI
                const vimeoId = extractVimeoId(data.videoLink);
                if (vimeoId) {
                    const { transcriptionText, embedding } = await microserviceAPI.getVimeoTranscription(vimeoId);
                    console.log("data from api", transcriptionText, embedding)
                    videoTranscription = transcriptionText;
                    videoEmbedding = embedding;
                }
            } else {
                // If not a Vimeo video, clear transcription, embedding and thumbnail
                videoTranscription = null;
                videoEmbedding = null;
                thumbnailUrl = null;
            }
        }

        drill.categoryId = (data.categoryId || drill.categoryId);
        drill.videoLink = (data.videoLink || drill.videoLink);
        drill.title = (data.title || drill.title);
        drill.description = (data.description || drill.description);
        drill.isFree = (data.isFree !== undefined ? data.isFree : drill.isFree);
        drill.recommendationCriteria = (data.recommendationCriteria === null ? null : data.recommendationCriteria || drill.recommendationCriteria);
        drill.videoTranscription = videoTranscription || drill?.videoTranscription;
        drill.videoEmbedding = videoEmbedding || drill?.videoEmbedding;
        drill.thumbnailUrl = thumbnailUrl || undefined;
     console.log("drill got finally ", drill)
        await drill.save()

        return NextResponse.json({ message: `drill has been updated` }, { status: 200 })
    } catch (err: unknown) {
        console.error(err)
        const obj = validateError(err)
        return NextResponse.json({ message: obj.message }, { status: obj.status })
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const session = await getServerSession(authOption);
        if (!session || !session.user || session.user.role !== 'admin') return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

        const { pathname } = new URL(req.url);
        const id = pathname.split('/').pop(); // /api/drills/:id
        if (!id) return NextResponse.json({ message: 'id is required' }, { status: 400 })

        const drill = await Drill.findOne({ _id: id })
        if (!drill) return NextResponse.json({ message: 'Invalid drill Id' }, { status: 404 });

        await drill.deleteOne()

        return NextResponse.json({ message: 'drill has been deleted' }, { status: 200 })
    } catch (err: unknown) {
        console.error(err)
        const obj = validateError(err)
        return NextResponse.json({ message: obj.message }, { status: obj.status })
    }
}
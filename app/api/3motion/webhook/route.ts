import { NextRequest, NextResponse } from "next/server";
import { Video } from "@/app/lib/models";
import { validateError } from "@/app/lib/functions";
import { PostVideoUpload } from "@/app/lib/zapier";
import { sendNotification, updateAssessment } from "@/app/lib/assessments";

export async function POST(req: NextRequest) {
  try {
    console.log("[/api/3motion/webhook] called");
    const data = await req.json();

    console.log("[/api/3motion/webhook] data", data);

    if (!data.TaskId) {
      console.log("[/api/3motion/webhook] Invalid Request");
      return NextResponse.json({ message: `Invalid Request` }, { status: 400 });
    }

    const video = await Video.findOne({
      assessmentMappingId: data.TaskId.toString(),
    });

    if (!video) {
      console.log("[/api/3motion/webhook] Invalid TaskId");
      return NextResponse.json({ message: `Invalid TaskId` }, { status: 404 });
    }

    // Process assessment details in a separate thread after 1 minute
    setTimeout(async () => {
      try {
        console.log("[/api/3motion/webhook] Starting assessment processing...");
        const assessmentDetails = await updateAssessment(video._id);

        if (assessmentDetails.statusCode === "Completed") {
          try {
            await sendNotification(video, assessmentDetails.statusCode);
          } catch (error) {
            console.error('[/api/3motion/webhook] Error sending notification:', error);
            // Continue execution even if notification fails
          }
          
          try {
            await PostVideoUpload(video._id);
          } catch (err) {
            console.error("[/api/3motion/webhook] Zapier Error:", err);
          }
        }

        console.log("[/api/3motion/webhook] assessmentDetails updated");
      } catch (err) {
        console.error("[/api/3motion/webhook] Error in assessment processing:", err);
      }
    }, 60 * 1000); // 1 minute

    return NextResponse.json({ message: "OK" }, { status: 200 });
  } catch (err: unknown) {
    console.error("[/api/3motion/webhook] error:", err);
    const obj = validateError(err);
    return NextResponse.json({ message: obj.message }, { status: obj.status });
  }
}


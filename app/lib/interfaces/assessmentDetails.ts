
export interface IAssessmentDetails {
    taskId: number,
    taskName: string,
    taskType: string,
    taskIdWithType: string,
    tenantId: number,
    tenantName: string,
    individualId: number,
    individualName: string,
    creationTime: string,
    statusCode: "InProgress" | "Completed" | "Error",
    statusText: string,
    fileUrl: string,
    taskScore: number,
    dataJsonUrl: string,
    pdfUrl: string,
    overlayUrl: string,
    imgUrl: string | null,
    stats: any | undefined;
    s3FileUrl?: string | null;
    s3DataJsonUrl?: string | null;
    s3PdfUrl?: string | null;
    s3OverlayUrl?: string | null;
}

export interface IAssessmentDetailsNew {
    name: string;
    compositeReportUrl: string | null;
    movementCode: string;
    statusCode: "InProgress" | "Completed" | "Error";
    assessmentDetailId: number;
    assessmentTypeName: number;
    assessmentTypeCode: string;
    score: number;
    fileUrl: string | null;
    dataJsonUrl: string | null;
    coordinates3dUrl: string | null;
    overlayUrl: string | null;
    pdfUrl: string | null;
    pdaiJson: string | null;
    kinematicsJson: string | null;
    userId: string;
    userName: string;
    summary: string | null;
    bodymapUrl: string | null;
    previousSummaryData: string | null;
    organizationUnits: string[];
    organizationUnitId: string | null;
    tenantId: string;
    tenantName: string;
    requestOrigin: string;
    csvUrl: string | null;
    extraProperties: string | null;
    assessmentTypeDescription: string;
    isDeleted: boolean;
    deleterId: string | null;
    deletionTime: string | null;
    lastModificationTime: string;
    lastModifierId: string | null;
    creationTime: string;
    creatorId: string;
    id: number;
    stats?: IAssessmentData;
    s3FileUrl?: string | null;
    s3DataJsonUrl?: string | null;
    s3PdfUrl?: string | null;
    s3OverlayUrl?: string | null;
}

export interface IAssessmentData {
    info: {
        fileID: string;
        fileEXT: string;
        units: string;
        task_name: string;
        statusA: number;
        statusB: string;
        tasktype: string;
        taskversion: string | null;
        pain: string;
        tenant: string;
        date: string;
        version: string;
        name: string;
        "team/org": string;
        height: number;
        weight: number;
        videoFrames: number;
        frameRate: number;
        tracking_score_upper: number;
        tracking_score_lower: number;
    };
    events: {
        [key: string]: number;
    };
    performance: {
        score1: [number, string];
        score2: [number, string];
        score3: [number, string];
    };
    metrics: {
        hand_speed: number;
        release_time: number;
        stride_length_percent: number;
        stride_length: number;
        stride_time: number;
        hip_shoulder: number;
        hss_fp: number;
        hss_br: number;
        peak_torso_vel: number;
        peak_pelvis_vel: number;
        rotation_time: number;
        max_shoulder_er: number;
        knee_flexion_fp: number;
        knee_flexion_br: number;
        knee_flexion_ft: number;
        wrist_flexion_pt: number;
        wrist_flexion_pl: number;
        wrist_flexion_br: number;
        elbow_extension_br: number;
        trunk_flexion_mer: number;
        trunk_lateral_flexion_mer: number;
        trunk_flexion_br: number;
        trunk_lateral_flexion_br: number;
        trunk_flexion_ft: number;
        trunk_lateral_flexion_ft: number;
        trunk_rotation_ft: number;
        foot_turnout_fp: number;
        sequence: number[];
        sequence_score: number;
        acceleration_score: number;
        deceleration_score: number;
        efficiency_score: number;
        overall_score: number;
    };
    ARR: {
        [key: string]: number[];
    } | null;
    ANG: {
        [key: string]: number[];
    } | null;
    VEL: {
        [key: string]: number[];
    } | null;
}
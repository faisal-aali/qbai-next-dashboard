
/** @step1 UPDATE STATUS CODE */

// filter: by the following in compass
// {
//     "assessmentDetails.statusCode": 2,
//     motionApiVersion: "legacy"
//   }

// update: by the following in compass
// {
//   $set: {
//     "assessmentDetails.statusCode": "Error"
//   },
//  }

// filter: by the following in compass
// {
//     "assessmentDetails.statusCode": 1,
//     motionApiVersion: "legacy"
//   }

// update: by the following in compass
// {
//   $set: {
//     "assessmentDetails.statusCode": "Completed"
//   },
//  }

/** @step2 RENAME reportPdfUrl to pdfUrl */

// filter: by the following in compass
// {
//     "assessmentDetails.reportPdfUrl": { $exists: true }
//   }

// update: by the following in compass
// {
//   $rename: {
//     "assessmentDetails.reportPdfUrl": "assessmentDetails.pdfUrl"
//   }
// }

/** @step3 RENAME overlayVideoUrl to overlayUrl */

// filter: by the following in compass
// {
//     "assessmentDetails.overlayVideoUrl": { $exists: true }
//   }

// update: by the following in compass
// {
//   $rename: {
//     "assessmentDetails.overlayVideoUrl": "assessmentDetails.overlayUrl"
//   }
// }

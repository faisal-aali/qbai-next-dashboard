import { useCallback, useEffect, useState } from "react";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import CloseIcon from "@mui/icons-material/Close";
import { Field, Form, Formik } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { useApp } from '../../../Context/AppContext';
import { generateYoutubeEmbedUrl } from "@/util/utils";
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import MetricsSelector from "../MetricsSelector/MetricsSelector";
import { Tooltip } from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  boxShadow: 24,
  p: 4,
  borderRadius: "8px",
  maxHeight: '90vh',
  overflow: 'auto'
};

const validationSchema = Yup.object({
  categoryId: Yup.string().required("Required"),
  videoLink: Yup.string().required("Required"),
  title: Yup.string().required("Required"),
  description: Yup.string().required("Required"),
});

const EditVideoModal = ({ open, onClose, videoId, videoData, categories, onSuccess, recommendationsCriteria }) => {
  const { showSnackbar } = useApp();
  const [activeStep, setActiveStep] = useState(0);
  const [metrics, setMetrics] = useState();



  // useEffect(() => {
  //   if (!videoData || !videoData.recommendationCriteria) return;
  //   const initialMetrics = videoData.recommendationCriteria.reduce((acc, criteria) => ({
  //     ...acc,
  //     [criteria.refId]: {
  //       value: criteria.value,
  //       selected: true,
  //       op: criteria.op
  //     }
  //   }), {})
  //   setMetrics(initialMetrics)
  // }, [recommendationsCriteria])

  useEffect(() => {
    if (!recommendationsCriteria || !videoData) return;

    if (recommendationsCriteria.length === 0) throw new Error('Recommendations criteria is empty')

    console.log('[recommendationsCriteria]', recommendationsCriteria)

    const count = {};
    const parsedRecommendationsCriteria = videoData.recommendationCriteria && videoData.recommendationCriteria.map(criteria => {
      const referencedCriteria = recommendationsCriteria.find(c => c._id.replace(/_1$/, '') === criteria.refId);
      if (!referencedCriteria) throw new Error(`Criteria with id ${criteria.refId} not found in recommendations criteria`)
      const { _id, doubleValue } = referencedCriteria;

      if (doubleValue) {
        count[_id] = (count[_id] || 0) + 1;
        return { ...criteria, refId: `${criteria.refId}_${count[_id]}` };
      }

      return criteria;
    });

    console.log('[parsedRecommendationsCriteria]', parsedRecommendationsCriteria)

    const initialMetrics = recommendationsCriteria.reduce((acc, criterion) => {
      const existingMetric = parsedRecommendationsCriteria && parsedRecommendationsCriteria.find(c => c.refId === criterion._id);
      return {
        ...acc,
        [criterion._id]: {
          value: existingMetric ? existingMetric.value : criterion.range[0],
          selected: existingMetric ? true : false,
          op: existingMetric ? existingMetric.op : 'above'
        }
      }
    }, {})

    setMetrics(initialMetrics)
  }, [recommendationsCriteria, videoData])

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.keyCode === 27) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, [onClose]);

  const steps = ['Video Details', 'Recommendation Criteria (optional)'];

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleSubmit = async (values) => {
    try {
      const recommendationCriteria = Object.entries(metrics)
        .filter(([_, metric]) => metric.selected)
        .map(([id, metric]) => ({
          refId: id.replace(/_1$/, '').replace(/_2$/, ''),
          value: metric.value,
          op: metric.op
        }));

      await axios.post(`/api/drills/${videoId}`, {
        ...values,
        recommendationCriteria: recommendationCriteria.length > 0 ? recommendationCriteria : null,
        videoLink: (values.videoLink.match('youtube') || values.videoLink.match('youtu.be')) ? generateYoutubeEmbedUrl(values.videoLink) : values.videoLink
      }).then(res => {
        showSnackbar('Changes Saved!', 'success');
        onSuccess && onSuccess();
        onClose();
      });
    } catch (err) {
      showSnackbar(err.response?.data?.message || err.message, 'error');
    }
  };

  const getStepInvalid = useCallback((values, index) => {
    console.log('[getStepInvalid] activeStep', activeStep)
    if (activeStep === index) return undefined
    if (index === 0) {
      const invalid = (!values.categoryId || !values.videoLink || !values.title || !values.description)
      console.log('[getStepInvalid] invalid', invalid)
      return invalid
    }
    return false
  }, [activeStep])

  return (
    <Modal open={open} onClose={onClose} aria-labelledby="edit-video-modal-title">
      <Box sx={style} className="w-full max-w-3xl blueBackground px-16">
        <IconButton
          style={{ position: "absolute", top: 10, right: 10, color: '#fff' }}
          onClick={onClose}
        >
          <CloseIcon />
        </IconButton>

        <h2 className="text-2xl font-bold mb-8 text-center">
          Edit Video Details
        </h2>

        <Formik
          initialValues={{
            categoryId: videoData?.categoryId || "",
            videoLink: videoData?.videoLink || "",
            title: videoData?.title || "",
            description: videoData?.description || "",
          }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting, errors, touched, values, setFieldValue }) => (
            <Form>

              <Stepper activeStep={activeStep} alternativeLabel className="mb-8" sx={{
                "& .MuiStepConnector-root": {
                  top: '16px',
                  left: 'calc(-50% + 40px)',
                  right: 'calc(50% + 40px)',
                },
              }}>
                {steps.map((label, index) => (
                  <Step key={label}>
                    <StepLabel
                      error={getStepInvalid(values, index)}
                      sx={{
                        "& .MuiStepLabel-label": {
                          color:
                            activeStep === index
                              ? "#32E100 !important"
                              : "#89939E !important",
                        },
                        "& .MuiStepIcon-text": {
                          fill:
                            activeStep === index
                              ? "#32E100 !important"
                              : "#89939E !important",
                        },
                        "& .MuiSvgIcon-root": {
                          color: "transparent !important",
                        },
                        "& .MuiSvgIcon-root.Mui-completed": {
                          color: "#32E100 !important",
                        },
                        "& .MuiStepLabel-iconContainer": {
                          border: '1px solid #89939E',
                          borderRadius: '50%',
                          padding: '5px !important',
                        },
                      }}
                    >
                      {label}
                    </StepLabel>
                  </Step>
                ))}
              </Stepper>

              {activeStep === 0 && (
                <div className="grid grid-cols-1 gap-4 mb-4" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  <div className="grid gap-2">
                    <div className="opacity-45">
                      <label htmlFor="category">Category</label>
                    </div>
                    <TextField
                      variant="outlined"
                      select
                      fullWidth
                      InputProps={{ style: { height: 50 } }}
                      value={values.categoryId}
                      onChange={(e) => setFieldValue('categoryId', e.target.value)}
                    >
                      {categories.map(cat => (
                        <MenuItem key={cat._id} value={cat._id}>{cat.name}</MenuItem>
                      ))}
                    </TextField>
                  </div>
                  <div className="grid gap-2">
                    <div className="opacity-45">
                      <label htmlFor="videoLink">Video Link</label>
                    </div>
                    <Field
                      name="videoLink"
                      className={`w-full bg-transparent px-3 rounded-lg py-3 text-primary rounded focus:outline-none focus:border-green-500 placeholder:opacity-45 
                        ${errors.videoLink && touched.videoLink
                          ? "border-red-900	border"
                          : "primary-border focus:border-green-500"
                        }`}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <div className="opacity-45">
                      <label htmlFor="title">Title</label>
                    </div>
                    <Field
                      className={`w-full bg-transparent px-3 rounded-lg py-3 text-primary rounded focus:outline-none focus:border-green-500 placeholder:opacity-45
                        ${errors.title && touched.title
                          ? "border-red-900	border"
                          : "primary-border focus:border-green-500"
                        }`}
                      name="title"
                      as='input'
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <div className="opacity-45">
                      <label htmlFor="title">Description</label>
                    </div>
                    <Field
                      className={`w-full bg-transparent px-3 rounded-lg py-3 text-primary rounded focus:outline-none focus:border-green-500 placeholder:opacity-45
                        ${errors.description && touched.description
                          ? "border-red-900	border"
                          : "primary-border focus:border-green-500"
                        }`}
                      name="description"
                      as='textarea'
                      rows={5}
                      required
                    />
                  </div>
                </div>
              )}

              {activeStep === 1 && (
                <div className="flex flex-col gap-[12px]">
                  <div>
                    {(metrics && <MetricsSelector
                      criteria={recommendationsCriteria}
                      metrics={metrics}
                      setMetrics={setMetrics}
                    />)}
                  </div>
                  <div>
                    <p className="text-gray-500">Note: To not recommend this video, all the above can be left unchecked</p>
                  </div>
                  <div className="flex flex-row items-center gap-[6px]">
                    <div>
                      <Tooltip title="To determine whether this video is recommended, the system will fetch the recent 3 processed videos for the user. If any (not all) of the above criteria is met in the player's metrics, then this video will be recommended. Otherwise, it will not be recommended.">
                        <InfoIcon className="text-gray-500" />
                      </Tooltip>
                    </div>
                    <div>
                      <p className="text-gray-500 underline">How recommendation works</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-center mt-6 gap-4">
                {activeStep > 0 && (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="bg-primary dark-blue-color rounded w-28 h-9 flex items-center justify-center text-lg font-bold hover-button-shadow"
                  >
                    BACK
                  </button>
                )}
                {activeStep < steps.length - 1 && (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="bg-primary dark-blue-color rounded w-28 h-9 flex items-center justify-center text-lg font-bold hover-button-shadow"
                  >
                    NEXT
                  </button>
                )}
                <button
                  type="submit"
                  className={`bg-primary dark-blue-color rounded w-28 h-9 flex items-center justify-center text-lg font-bold hover-button-shadow ${activeStep < steps.length - 1 ? 'hidden' : ''}`}
                  disabled={isSubmitting}
                >
                  SUBMIT
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </Box>
    </Modal>
  );
};

export default EditVideoModal;
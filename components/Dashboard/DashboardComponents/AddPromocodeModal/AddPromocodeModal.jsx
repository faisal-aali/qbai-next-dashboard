import { useEffect } from "react";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Info from "@mui/icons-material/Info";
import CloseIcon from "@mui/icons-material/Close";
import { Field, Form, Formik } from "formik";
import * as Yup from "yup";
import axios from 'axios';
import { useApp } from '../../../Context/AppContext';

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
  code: Yup.string().required("Code is required"),
  description: Yup.string().required("Description is required"),
  discountPercentage: Yup.number().min(1, 'Discount % must be greater than 0').max(100, 'Discount % must be less than 101').strict().when('type', {
    is: 'purchase_discount',
    then: schema => schema.required('Discount % is required'),
    otherwise: schema => schema.optional(),
  }),
  claimCredits: Yup.number().min(1, 'Credits must be greater than 0').optional().strict().when('type', {
    is: 'free_credits',
    then: schema => schema.required('Credits is required'),
    otherwise: schema => schema.optional(),
  }),
  uses: Yup.number().min(1, 'Uses must be greater than 0').required("Uses is required").strict(),
  type: Yup.string().oneOf(['purchase_discount', 'free_credits'], 'Invalid type provided').required("Type is required"),
  productId: Yup.string().optional(),
  expirationDate: Yup.date().required('Date is required'),
});

const AddPromocodeModal = ({ open, onClose, onSuccess }) => {
  const { showSnackbar } = useApp();

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
  }, []);

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      setSubmitting(true)
      await axios.post("/api/promocodes", {
        ...values,
        discountPercentage: (values.type === 'purchase_discount' && values.discountPercentage) || null,
        claimCredits: (values.type === 'free_credits' && values.claimCredits) || null,
      });
      showSnackbar('Promo code has been added', 'success');
      onSuccess && onSuccess()
      onClose();
      setSubmitting(false)
    } catch (err) {
      showSnackbar(err.response?.data?.message || err.message, 'error');
      setSubmitting(false)
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={style} className="w-full max-w-3xl blueBackground px-16">
        <IconButton
          style={{ position: "absolute", top: 10, right: 10, color: '#fff' }}
          onClick={onClose}
        >
          <CloseIcon />
        </IconButton>
        <h2 className="text-2xl font-bold mb-8 text-center flex flex-col">
          <span>To Add a promo code, </span>Please enter the details below.
        </h2>
        <Formik
          initialValues={{
            code: "",
            description: "",
            discountPercentage: "",
            claimCredits: "",
            uses: "",
            type: "purchase_discount",
            productId: "",
            expirationDate: "",
          }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting, errors, touched, setFieldValue, values }) => (
            <Form>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="grid gap-2">
                  <div className="opacity-45">
                    <label htmlFor="code">Code</label>
                  </div>
                  <Field
                    name="code"
                    as="input"
                    type="text"
                    className={`w-full bg-transparent px-3 rounded-lg py-3 text-primary rounded focus:outline-none focus:border-green-500 placeholder:opacity-45
                      ${errors.code && touched.code
                        ? "border-red-900 border"
                        : "primary-border focus:border-green-500"
                      }`}
                  />
                </div>
                <div className="grid col-span-2 gap-2">
                  <div className="flex opacity-45 gap-2 items-center">
                    <label htmlFor="description">Description</label>
                    <Tooltip title="This description will be displayed on popup (if enabled)" sx={{ backgroundColor: 'red' }}>
                      <IconButton disableRipple sx={{ color: 'white', width: 20, height: 20 }}>
                        <Info />
                      </IconButton>
                    </Tooltip>
                  </div>
                  <Field
                    name="description"
                    as="input"
                    type="text"
                    className={`w-full bg-transparent px-3 rounded-lg py-3 text-primary rounded focus:outline-none focus:border-green-500 placeholder:opacity-45
                      ${errors.description && touched.description
                        ? "border-red-900 border"
                        : "primary-border focus:border-green-500"
                      }`}
                  />
                </div>
                <div className="grid gap-2">
                  <div className="opacity-45">
                    <label htmlFor="uses">Uses</label>
                  </div>
                  <Field
                    name="uses"
                    as="input"
                    type="number"
                    className={`w-full bg-transparent px-3 rounded-lg py-3 text-primary rounded focus:outline-none focus:border-green-500 placeholder:opacity-45
                      ${errors.uses && touched.uses
                        ? "border-red-900 border"
                        : "primary-border focus:border-green-500"
                      }`}
                  />
                </div>
                <div className={`grid gap-2 ${values.type !== 'purchase_discount' && 'hidden'}`}>
                  <div className="opacity-45">
                    <label htmlFor="discountPercentage">Discount</label>
                  </div>
                  <div className="relative">
                    <Field
                      name="discountPercentage"
                      as="input"
                      type="number"
                      className={`w-full bg-transparent px-3 rounded-lg py-3 text-primary rounded focus:outline-none focus:border-green-500 placeholder:opacity-45
                      ${errors.discountPercentage && touched.discountPercentage
                          ? "border-red-900 border"
                          : "primary-border focus:border-green-500"
                        }`}
                    />
                    <div className="absolute bottom-3 right-4 opacity-50 text-white">
                      %
                    </div>
                  </div>
                </div>
                <div className={`grid gap-2 ${values.type !== 'free_credits' && 'hidden'}`}>
                  <div className="opacity-45">
                    <label htmlFor="claimCredits">Credits</label>
                  </div>
                  <Field
                    name="claimCredits"
                    as="input"
                    type="number"
                    className={`w-full bg-transparent px-3 rounded-lg py-3 text-primary rounded focus:outline-none focus:border-green-500 placeholder:opacity-45
                      ${errors.claimCredits && touched.claimCredits
                        ? "border-red-900 border"
                        : "primary-border focus:border-green-500"
                      }`}
                  />
                </div>
                <div className="grid gap-2">
                  <div className="opacity-45">
                    <label htmlFor="type">Product Type</label>
                  </div>
                  <TextField
                    name="type"
                    select
                    fullWidth
                    variant="outlined"
                    value={values.type}
                    onChange={(e) => setFieldValue('type', e.target.value)}
                    InputProps={{ style: { height: 50 } }}
                  >
                    {[
                      { name: 'Credits Purchase Discount', value: 'purchase_discount' },
                      { name: 'Claim Free Credits', value: 'free_credits' }
                    ].map((obj) => (
                      <MenuItem key={obj.value} value={obj.value}>
                        {obj.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </div>
                <div className="grid gap-2">
                  <div className="opacity-45">
                    <label htmlFor="expirationDate">Expiration Date</label>
                  </div>
                  <Field
                    name="expirationDate"
                    as="input"
                    type="date"
                    className={`w-full bg-transparent px-3 rounded-lg py-3 text-primary rounded focus:outline-none focus:border-green-500 placeholder:opacity-45
                      ${errors.expirationDate && touched.expirationDate
                        ? "border-red-900 border"
                        : "primary-border focus:border-green-500"
                      }`}
                  />
                </div>
              </div>
              <div className="flex justify-center mb-10 mt-6">
                <button
                  type="submit"
                  className="bg-primary dark-blue-color rounded w-28 h-9 flex items-center justify-center text-lg font-bold"
                  disabled={isSubmitting}
                >
                  SUBMIT
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </Box>
    </Modal >
  );
};

export default AddPromocodeModal;

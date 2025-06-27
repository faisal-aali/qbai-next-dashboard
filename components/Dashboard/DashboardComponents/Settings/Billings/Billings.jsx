import { useEffect, useState } from "react";
import CircularProgress from "@mui/material/CircularProgress";
import UpdateCardDetails from "@/components/Common/UpdateCardDetails/UpdateCardDetails";
import axios from 'axios'
import { useApp } from "@/components/Context/AppContext";
import RefundCancellationPolicyDialog from "../../../../Refund&Cancellation/Refund&Cancellation"

const BillingTab = () => {
  const { user } = useApp()
  const [profileError, setProfileError] = useState(false)
  const [customer, setCustomer] = useState()
  const [paymentMethods, setPaymentMethods] = useState()
  const [updateDetails, setUpdateDetails] = useState(false)
  const [updateDetailsSucess, setUpdateDetailsSucess] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const [openModal, setOpenModal] = useState(false);

  const defaultPaymentMethod = (customer && paymentMethods && paymentMethods.find(pm => pm.id === customer.invoice_settings.default_payment_method))

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = () => {
    axios.get('/api/stripe/customer').then(res => {
      setCustomer(res.data)
      axios.get('/api/stripe/customer/paymentMethods').then(res => {
        setPaymentMethods(res.data)
      }).catch(err => {
        setProfileError(true)
        console.error(err)
      })
    }).catch(err => {
      setProfileError(true)
      console.error(err)
    })
  }

  const handleDownloadPaymentHistory = () => {
    setDownloading(true)
    axios.get('/api/stripe/customer/paymentHistory', {
      responseType: 'blob'
    }).then(async res => {
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'payment_history.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setDownloading(false)
    })
  }

  const handleOpenModal = () => setOpenModal(true);
  const handleCloseModal = () => setOpenModal(false);

  return (
    (!customer || !paymentMethods) && !profileError ? <CircularProgress /> :
      <>
        {updateDetails ? <UpdateCardDetails onUpdateSuccess={() => {
          setUpdateDetails(false)
          setUpdateDetailsSucess(true)
        }} /> :
          updateDetailsSucess ?

            <div className="text-center p-8 rounded-lg mx-auto">
              <div className="flex flex-col justify-center items-center h-full">
                <img
                  src={'/assets/checkmark.png'}
                  alt="Activated"
                  className="w-24 h-24 mb-4"
                />
                <h2 className="text-white text-3xl mt-2 mb-4 font-semibold capitalize">
                  Your billing details have been updated!
                </h2>
                <button
                  variant="contained"
                  className="bg-white text-black font-bold px-12 py-1 rounded mt-4"
                  onClick={() => {
                    setPaymentMethods(false)
                    setCustomer(false)
                    setUpdateDetailsSucess(false)
                    fetchData()
                  }}
                >
                  OK
                </button>
              </div>
            </div> :
            <div>
              <div className="flex gap-6 flex-col md:flex-row">
                <div className="border primary-border py-8 px-4 md:px-16 flex justify-center flex flex-col rounded-lg w-fit 2xl:pr-[100px] w-full md:w-auto">
                  <div>
                    <h2 className="text-xl font-bold">Billing Details</h2>
                    {profileError ?
                      <p>No billing profile found.</p> :
                      <div>
                        <p className="text-primary mt-1">{defaultPaymentMethod.billing_details.name}</p>
                        <p className="text-primary mt-1">xxxx-xxxx-xxxx-{defaultPaymentMethod.card.last4}</p>
                        <p className="text-primary mt-1">Expires on {defaultPaymentMethod.card.exp_month}/{defaultPaymentMethod.card.exp_year}</p>
                        <div>
                          <button onClick={() => setUpdateDetails(true)} className="font-bold mt-2">ADD NEW DETAILS</button>
                        </div>
                        <div>
                          <button className="font-bold mt-2" onClick={handleDownloadPaymentHistory}>
                            {downloading ? <CircularProgress size={20} /> : 'DOWNLOAD BILLING HISTORY'}
                          </button>
                        </div>
                      </div>
                    }
                  </div>
                </div>
                <div className="border primary-border py-8 px-4 md:px-16 justify-center flex flex-col rounded-lg w-fit 2xl:pr-[200px] w-full md:w-auto">
                  <div>
                    <h2 className="text-xl font-bold mt-2">Plan Details</h2>
                    <p className="mt-2">{user.subscription.package?.name || 'Free'}</p>
                    {user.subscription.package?.amount &&
                      <p className="text-primary mt-2 font-bold">${(user.subscription.package?.amount / 100).toFixed(2)} {user.subscription.package?.plan}</p> || <></>}
                  </div>
                </div>
              </div>
              <div className="mt-6 pl-2">
                <p>Want to cancel your subscription?</p>
                <p>
                  We're sad to see you go. Please read our
                  <a href="#" className="text-primary ml-1 font-bold" onClick={handleOpenModal}>
                    Refund and Cancelation Policy
                  </a>
                </p>
                <p>
                  before contacting our support team at
                  <a
                    href="mailto:team@qbai.com"
                    className="text-primary underline ml-1 font-bold"
                  >
                    team@qbai.com
                  </a>
                </p>
              </div>
            </div>}
        <RefundCancellationPolicyDialog openModal={openModal} handleCloseModal={handleCloseModal} />
      </>
  );
};

export default BillingTab;

import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import { useRouter } from "next/navigation";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  boxShadow: 24,
  p: 4,
  borderRadius: "8px",
  maxHeight: "90vh",
  overflow: "auto",
};

const PayToWatchDialog = ({ open, onClose }) => {
  const router = useRouter();

  const handlePurchaseClick = () => {
    router.push("/subscriptions");
  };

  return (
    <Modal open={open} onClose={onClose} aria-labelledby="delete-modal-title">
      <Box sx={style} className="w-full max-w-[29rem] blueBackground">
        <div className="flex flex-col justify-center items-center gap-5">
          <div className="text-center">
            <h3 className="mb-2">Pay To Watch</h3>
            <p className="w-10/12 m-auto">You need to purchase a subscription to view this video.</p>
          </div>
          <div className="flex flex-row gap-4">
            <div className="flex justify-center">
              <button
                onClick={onClose}
                className="color-white border rounded-lg w-48 h-11 flex items-center justify-center text-lg font-bold"
              >
                CANCEL
              </button>
            </div>
            <div className="flex justify-center">
              <button
                onClick={handlePurchaseClick}
                className="bg-primary dark-blue-color rounded-lg w-48 h-11 flex items-center justify-center text-lg font-bold hover-button-shadow"
              >
                PURCHASE
              </button>
            </div>
          </div>
        </div>
      </Box>
    </Modal>
  );
};

export default PayToWatchDialog;

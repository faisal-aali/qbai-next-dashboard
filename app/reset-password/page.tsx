import ResetPassword from "../../components/ResetPassword/ResetPassword";
import '../globals.css';


const resetpassword = () => {
    return (
        <div className="min-h-screen flex items-center justify-center backgroundOverlay">
            <ResetPassword />
        </div>
    );
}

export default resetpassword;
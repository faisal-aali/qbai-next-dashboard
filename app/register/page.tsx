import RegisterForm from "../../components/RegisterForm/RegisterForm";
import '../globals.css';


const register = () => {
    return (
        <div className="min-h-screen overflow-auto relative">
            <div className="backgroundOverlay"></div>
            <div className="relative">
                <RegisterForm />
            </div>
        </div>
    );
}

export default register;
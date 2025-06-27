"use client";
import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { useRouter, useSearchParams } from "next/navigation";
import { getSession, signIn } from "next-auth/react";
import styles from "./LoginForm.module.css";
import Link from "next/link";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import useMediaQuery from '@mui/material/useMediaQuery';
import Image from 'next/image';


const LoginForm = () => {
  // const userSession = useSession().data?.user
  const router = useRouter();
  const [user, setUser] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const matches = useMediaQuery('(max-width:768px)');
  const [isSubmitting, setIsSubmitting] = useState(false)

  // useEffect(() => {
  //   console.log('matches', matches)
  // }, [matches]);

  useEffect(() => {
    getSession().then(data => {
      console.log('useEffect getSession', data)
      if (!data || !data.user) return
      if (data.user.role) router.push('/dashboard')
      else router.push(`/register?${new URLSearchParams(data.user).toString()}`)
    }).catch(console.error)
  }, []);

  const handleContinueWithGoogle = async (e) => {
    e.preventDefault();

    signIn("google").catch(err => {
      console.error('Error while continuing via google', err)
      setError("Error occured. Please try again");
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedEmail = user.email.trim();
    setIsSubmitting(true)
    const result = await signIn("credentials", {
      email: trimmedEmail,
      password: user.password,
      redirect: false,
      // callbackUrl: '/dashboard'
    })

    if (!result.error) {
      router.push('/dashboard')
    } else {
      setError(result.status === 401 ? "Invalid email or password" : result.error);
    }
    setIsSubmitting(false)
  };

  return (
    <div
      className={`flex flex-col md:flex-row min-h-screen items-center bg-zinc-900 relative ${!matches ? '' : styles.loginBackground}`}
    >
      <div className="backgroundOverlay"></div>
      <div className={`flex items-center py-16 cursor-pointer justify-center w-full lg:w-2/5 ${!matches ? styles.loginBackground : ''} h-fit md:h-screen`}>
        <div className="z-10" onClick={() => router.push('https://qbai.com')}>
          <Image
            src="/assets/qbai-log.png"
            alt="Logo"
            width={!matches ? 370 : 250}
            height={103}
          />
        </div>
      </div>
      <div className="flex items-center justify-center w-full p-8 lg:w-3/5 z-20  h-fit md:h-screen">
        <div className="bg-transparent border primary-border py-12 px-6 rounded-lg w-full max-w-[400px]">
          <h2 className="text-white text-2xl mb-6 text-center">Login</h2>
          <form className="mt-11" onSubmit={(e) => handleSubmit(e)}>
            <div className="mb-4">
              <input
                className="w-full bg-transparent px-3 rounded-lg py-3 text-white primary-border rounded focus:outline-none focus:border-green-500 placeholder:opacity-45"
                type="email"
                name="email"
                value={user.email}
                onChange={(e) =>
                  setUser((prevUser) => ({
                    ...prevUser,
                    email: e.target.value.trim(),
                  }))
                }
                onKeyDown={(e) => {
                  if (e.key === ' ') {
                    e.preventDefault();
                  }
                }}
                required
                placeholder="Email"
              />
            </div>
            <div className="mb-6 relative">
              <input
                className="w-full px-3 bg-transparent bg-opacity-20 rounded-lg py-3 text-white primary-border rounded focus:outline-none focus:border-green-500 placeholder:opacity-45"
                type={showPassword ? "text" : "password"}
                name="password"
                value={user.password}
                onChange={(e) =>
                  setUser((prevUser) => ({
                    ...prevUser,
                    password: e.target.value,
                  }))
                }
                required
                placeholder="Password"
              />
              <span
                className="absolute inset-y-0 right-3 flex items-center cursor-pointer text-white"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
            <div className="text-red-500 mb-4">{error}</div>
            <div className="flex justify-between items-center mb-6">
              <Link
                href="/forgetpassword"
                className="text-green-500 text-sm text-primary"
              >
                Forgot Password?
              </Link>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary rounded-lg text-black font-normal py-3 rounded hover-shadow focus:outline-none"
            >
              LOGIN
            </button>
          </form>
          <button
            onClick={handleContinueWithGoogle}
            className="w-full bg-white border-blue-500 border-solid border-2 rounded-lg text-black font-normal py-3 rounded focus:outline-none mt-4"
          >
            <div className="flex flex-row items-center gap-2 justify-center">
              <div>
                <img src="/assets/google-icon.png" width={32} height={32} />
              </div>
              <p style={{
                fontFamily: `"Euclid Circular A", "Helvetica Neue", Helvetica, Arial, sans-serif !important`,
                fontWeight: 700,
                fontSize: '16px',
                lineHeight: '28px',
                color: 'rgb(92, 108, 117)'
              }}>
                Continue with Google
              </p>
            </div>
          </button>
          <div className="flex flex-col md:flex-row items-center justify-center mt-6 gap-2">
            <div>
              <p className="text-zinc-400">
                Don't have an account?
              </p>
            </div>
            <div>
              <Link href="/register" className="text-white font-bold">
                REGISTER NOW
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;

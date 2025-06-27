"use client";

import { useRouter } from "next/navigation";

const LoginToPortal = () => {
  const router = useRouter()

  return (
    <div className="px-8">
      <div className="bg-transparent border primary-border rounded-lg max-w-lg">
        <div className="py-8">
          <h2 className="text-4xl mb-2 text-center"> Welcome to the</h2>
          <h3 className="text-primary mb-4 text-4xl text-center">QBAI</h3>
          <p className="text-zinc-400 text-center  px-4 mb-6">
            Thank you for choosing QBAI to bring biomechanics into your
            player development routine. Make sure to follow us on Twitter and
            Instagram and tag us in your posts.
          </p>
          <div className="text-center px-5 mt-8">
            <button
              onClick={() => router.replace('/dashboard')}
              type="submit"
              className="bg-primary rounded-lg w-full text-black font-normal px-3 py-3 rounded hover-shadow focus:outline-none"
            >
              {/* LOG IN TO THE WEB PORTAL */}
              OPEN DASHBOARD
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginToPortal;

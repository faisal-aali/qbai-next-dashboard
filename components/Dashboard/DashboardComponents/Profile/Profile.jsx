"use client"

import { useApp } from "@/components/Context/AppContext";
import CircularProgress from "@mui/material/CircularProgress";
import { useRouter } from "next/navigation";
import { formatLocation } from "@/util/utils";

const ProfilePage = () => {
  const { user } = useApp()
  const route = useRouter()

  return (
    !user ? <CircularProgress /> :
      <div className="p-0 md:p-4">
        <div className="p-0 md:p-6 max-w-4xl w-full">
          <h1 className="text-white text-3xl mb-6">Your Profile</h1>
          <div
            className="flex flex-col md:flex-row p-8 rounded-2xl flex md:items-start items-center mt-12 gap-4"
            style={{
              background:
                "linear-gradient(115.84deg, #32E100 -127.95%, #090F21 66.31%)",
            }}
          >
            <div>
              <img
                src={user.avatarUrl || '/assets/dummy-profile-image.png'}
                alt={user.name}
                className="rounded-lg w-full md:w-[300px] h-[180px] md:h-[410px]"
                style={{ objectFit: 'cover' }}
              />
            </div>
            <div className="flex-1 w-full">
              <div
                className="flex justify-between items-center mb-2 rounded-lg p-4"
                style={{ background: "#32E1004D", padding: "11px 12px" }}
              >
                <h2 className="text-lg md:text-4xl font-normal">{user.name}</h2>
                <button onClick={() => route.replace('/settings')} className="bg-white text-green-600 rounded-lg p-2 focus:outline-none">
                  <img src="assets/edit-icon.svg" alt="" />
                </button>
              </div>
              <p className="text-base	pb-4 pt-2 mb-2 border-b border-solid primary-border-color">
                {user.bio || 'Add bio description...'}
              </p>
              <p className="text-base mb-2 pb-4 pt-2 border-b border-solid primary-border-color font-bold	">
                Email: <span className="font-normal">{user.email}</span>
              </p>
              <p className={`text-base mb-2 pb-4 pt-2 border-b border-solid primary-border-color font-bold `}>
                Location: <span className="text-primary capitalize">{formatLocation(user.city, user.state, user.country)}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
  );
};

export default ProfilePage;

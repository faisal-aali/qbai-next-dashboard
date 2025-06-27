"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import CircularProgress from "@mui/material/CircularProgress";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import { useApp } from "../../Context/AppContext";
import styles from "./PickYourMembership.module.css";
import { useMediaQuery, useTheme } from "@mui/material";

const PickYourMembership = ({ role, onBack, onSubmit, excludeFree }) => {
  const { user } = useApp();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("lg")); // Checks if screen size is below 'md'

  const [selectedPackage, setSelectedPackage] = useState("");
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("quarterly");

  useEffect(() => {
    console.log("User packageId: ", user?.subscription?.packageId);
    axios
      .get("/api/packages", {
        params: {
          role: role,
        },
      })
      .then((res) => setPackages(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredPackages = packages.filter(
    (_package) => (_package.plan === selectedTab) || (!excludeFree && _package.plan === "free")
  );

  const formatPackagePlan = (plan) => (
    plan === 'quarterly' ? 'Quarterly' :
      plan === 'half-yearly' ? 'Semi-Annually' :
        plan === 'yearly' ? 'Annually' : plan
  )

  const isPopular = (name) => (
    ['Varsity Membership', 'Silver Membership'].includes(name)
  )

  const isCoachingAvailable = (_package) => (
    _package.role === 'player' && !['free'].includes(_package.plan)
  )

  const handleSelectPackage = (packageId) => {
    setSelectedPackage(packageId);
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div className="text-center mb-2">
        <h2 className="text-white text-2xl md:text-3xl mb-2">Pick your Membership</h2>
      </div>

      <div className="flex justify-center mb-6 relative">
        <Tabs
          orientation={isSmallScreen ? 'vertical' : 'horizontal'}
          value={selectedTab}
          onChange={(e, newValue) => setSelectedTab(newValue)}
          indicatorColor="none"
          aria-label="category tabs"
          className="!blueBackground py-2.5 rounded-lg w-fit px-3"
          sx={{
            backgroundColor: "#001f3f",
            border: '1px dashed white',
            ".MuiTabs-flexContainer": {
              justifyContent: "center",
              gap: "10px"
            },
            ".MuiTab-root": {
              minHeight: "40px",
              backgroundColor: "#32E10026",
              borderRadius: "6px",
              fontWeight: 500,
              fontSize: "15px",
              textTransform: "capitalize",
              padding: "10px",
              color: "#fff !important",
              minWidth: 150,
              height: "44px",
              paddingX: '20px',
              paddingY: '10px'
            },
            ".Mui-selected": {
              backgroundColor: "#00ff00",
              color: "#000 !important",
            },
          }}
        >
          <Tab label="QUARTERLY PRICING" value="quarterly" />
          <Tab label="SEMI-ANNUAL PRICING" value="half-yearly" />
          <Tab label={(
            <div className="flex flex-row gap-[10px] items-center">
              <div>
                <p className="text-inherit">ANNUAL PRICING</p>
              </div>
              <div className="flex flex-row bg-primary rounded-[100px] items-center px-[10px] py-[5px]">
                <p className="dark-blue-color text-[10px]">BONUS</p>
              </div>
            </div>
          )} value="yearly" />
        </Tabs>
      </div>

      {loading ? (
        <div className="flex justify-center">
          <CircularProgress />
        </div>
      ) : (
        <div className="flex flex-wrap gap-8 justify-center">
          {filteredPackages.map((_package, index) => (
            <div
              key={index}
              style={{
                boxShadow: isPopular(_package.name) && '0 0 20px 3px rgba(50, 225, 0, 0.3)'
              }}
              className={`drop-shadow-[0_35px_35px_rgba(50, 225, 0, 1)] max-w-full md:max-w-[250px] relative blueBackground flex flex-col items-center text-center cursor-pointer rounded-lg transition-all ${selectedPackage === _package._id
                ? styles.selectedPlan
                : styles.planCard
                } ${user?.subscription?.status === "active" &&
                  user?.subscription?.packageId === _package._id
                  ? "opacity-50 cursor-not-allowed"
                  : ""
                }`}
              onClick={() => {
                if (
                  user?.subscription?.status === "active" &&
                  user?.subscription?.packageId === _package._id
                )
                  return;
                handleSelectPackage(_package._id);
              }}
            >
              {selectedPackage === _package._id && (
                <img
                  src={"/assets/checkmark.png"}
                  alt="Selected"
                  className="absolute top-[-1rem] right-50-percent w-8 h-8"
                />
              )}
              <div className="py-4">
                <h3 className="text-white text-xl mb-2 uppercase">{_package.name.split(' ')[0]}</h3>
                {_package.plan !== "free" && (
                  <p className="text-primary text-3xl font-bold mb-2">
                    ${_package.amount / 100}
                  </p>)}
                {isPopular(_package.name) &&
                  <div className="mx-[32px] light-blue-background rounded-md">
                    <h3 style={{ color: 'rgba(227, 227, 227, 1)' }} className="text-white text-[16px] mb-2 uppercase">Most Popular</h3>
                  </div>
                }
                <h3 style={{ color: 'rgba(227, 227, 227, 1)' }} className="text-white text-[16px] mb-2 uppercase">{_package.plan === 'free' ? 'Free for life' : 'Billed ' + formatPackagePlan(_package.plan)}</h3>
                <ul className="text-left text-white mt-4 px-4">
                  <li className="mb-4 flex items-center">
                    <img
                      src="/assets/checkmark-2.png"
                      alt="Checkmark"
                      className="w-4 h-4 mr-2"
                    />
                    {_package.plan === "free"
                      ? "Limited access to drill library items"
                      : "Full access to drill library"}
                  </li>
                  {_package.plan !== "free" && (
                    <li className="mb-4 flex items-center">
                      <img
                        src="/assets/checkmark-2.png"
                        alt="Checkmark"
                        className="w-4 h-4 mr-2"
                      />
                      Access to member exclusive webinars
                    </li>
                  )}
                  {_package.throwsPerMonth &&
                    <li className="mb-4 flex items-center font-bold">
                      <img
                        src="/assets/checkmark-2.png"
                        alt="Checkmark"
                        className="w-4 h-4 mr-2"
                      />
                      {_package.throwsPerMonth} credit per month
                    </li> || <></>}
                  <li className="mb-4 flex items-center">
                    <img
                      src="/assets/checkmark-2.png"
                      alt="Checkmark"
                      className="w-4 h-4 mr-2"
                    />
                    {_package.plan === 'free' ? 'Credits' : 'Additional credits'} available at ${_package.amountPerCredit / 100}/credit
                  </li>
                  {isCoachingAvailable(_package) && (
                    <li className="mb-4 flex items-center">
                      <img
                        src="/assets/checkmark-2.png"
                        alt="Checkmark"
                        className="w-4 h-4 mr-2"
                      />
                      Coaching calls available*
                    </li>
                  )}
                  {_package.bonusCredits &&
                    <li className="flex items-center font-bold">
                      <img
                        src="/assets/checkmark-2.png"
                        alt="Checkmark"
                        className="w-4 h-4 mr-2"
                      />
                      {_package.bonusCredits} additional bonus credit
                    </li> || <></>}
                </ul>
              </div>
              <div className="p-4 w-full mt-auto">
                <button
                  className="w-full bg-primary text-black font-bold py-2 rounded-lg hover:hover-shadow-light transition-all"
                  onClick={() =>
                    onSubmit(packages.find((p) => p._id === selectedPackage))
                  }
                  disabled={selectedPackage !== _package._id} // Disable if not selected
                >
                  Get started
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="flex flex-col md:flex-row gap-4 md:gap-12 pl-0 md:pl-16 light-white-color mt-8">
        <div>
          <p className="light-white-color">1 credit = 1 throw breakdown</p>
        </div>
        <div className="hidden md:flex">
          <p className="light-white-color">|</p>
        </div>
        <div>
          <p className="light-white-color">*Coaching Calls available at additional fee</p>
        </div>
      </div>

      {onBack && (
        <div className="flex justify-end mt-8">
          <button
            className="bg-white text-black font-bold px-4 py-2 rounded mr-4"
            onClick={onBack}
          >
            BACK
          </button>
        </div>
      )}
    </div>
  );
};

export default PickYourMembership;

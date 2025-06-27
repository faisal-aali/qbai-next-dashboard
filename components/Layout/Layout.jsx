"use client";
import { useEffect, useRef, useState } from "react";
import Sidebar from "../Sidebar/Sidebar";
import { signOut, useSession, signIn } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { FiLogOut } from "react-icons/fi";
import { IoNotificationsOutline } from "react-icons/io5";
import HeaderProfile from "../Common/HeaderProfile/HeaderProfile";
import PromoCodesPopup from './PromoCodesPopup';
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Snackbar from "@mui/material/Snackbar";
import SnackbarContent from "@mui/material/SnackbarContent";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import CircularProgress from "@mui/material/CircularProgress";
import Badge from "@mui/material/Badge";
import Person from "@mui/icons-material/Person";
import VideoCameraBack from "@mui/icons-material/VideoCameraBack";
import UploadModal from "../Dashboard/DashboardComponents/UploadVideoModal/UploadModal";
import UpdateEmailModal from "../Dashboard/DashboardComponents/UpdateEmailModal/UpdateEmailModal";
import WarningIcon from "@mui/icons-material/Warning";
import CloseIcon from "@mui/icons-material/Close";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import MenuIcon from "@mui/icons-material/Menu";
import { useApp } from "../Context/AppContext";
import axios from 'axios';
import * as Yup from 'yup'
import { Field, Form, Formik } from "formik";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
  borderRadius: "8px",
  maxHeight: '90vh',
  overflow: 'auto'
};

const RegisterAccount = ({ user, onClose }) => {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState()

  const handleSubmit = (values, { setSubmitting }) => {
    setSubmitting(true)
    axios.post('/api/trainers', {
      email: values.email,
      password: values.password,
      name: user.name,
      city: user.city || undefined,
      state: user.state || undefined,
      country: user.country || undefined,
      avatarUrl: user.avatarUrl || undefined,
    }).then(async () => {
      const result = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      })

      if (!result.error) {
        router.push('/dashboard')
        onClose()
      } else {
        setError(result.status === 401 ? "Invalid email or password" : result.error);
      }
      setSubmitting(false)
    }).catch(err => {
      setSubmitting(false)
      setError(`Error occured: ${err.response?.data?.message || err.message}`)
    })
  }

  const schema = Yup.object().shape({
    email: Yup.string().email('Invalid email address').required('Email is required'),
    password: Yup.string().required("Required"),
    confirmPassword: Yup.string().oneOf([Yup.ref("password"), null], "Passwords must match").required("Required"),
  });

  return (
    <Formik
      initialValues={{
        email: '',
        password: '',
        confirmPassword: ''
      }}
      validationSchema={schema}
      onSubmit={handleSubmit}
    >
      {({ errors, touched, isSubmitting }) => (
        <Form className="w-full p-8">
          <div className="flex flex-col w-full gap-4">
            <div className="w-full">
              <div className="mb-1 opacity-45">
                <label htmlFor="">Email</label>
              </div>
              <Field
                type="email"
                name="email"
                placeholder="Email"
                className={`w-full py-3 px-3 bg-transparent primary-border rounded text-white rounded-lg focus:outline-none focus:outline-none focus:border-green-500 placeholder:opacity-45  ${errors.email && touched.email
                  ? "border-red-900 border"
                  : "primary-border focus:border-green-500"
                  }`}
              />
            </div>
            <div>
              <div className="mb-1 opacity-45">
                <label htmlFor="">New Password</label>
              </div>
              <div className="relative">
                <Field
                  name="password"
                  type={showPassword ? "text" : "password"}
                  className={`w-full py-3 px-3 dark-blue-background rounded-lg text-primary focus:outline-none placeholder:opacity-45 ${errors.password && touched.password
                    ? "border-red-900 border"
                    : "primary-border focus:border-green-500"
                    }`}
                  placeholder="Enter new password"
                />
                <div
                  className="absolute inset right-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-white"
                  onClick={() => setShowPassword(v => !v)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </div>
              </div>
            </div>
            <div>
              <div className="mb-1 opacity-45">
                <label htmlFor="">Confirm Password</label>
              </div>
              <div className="relative">
                <Field
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  className={`w-full py-3 px-3 dark-blue-background rounded-lg text-primary focus:outline-none placeholder:opacity-45 ${errors.confirmPassword && touched.confirmPassword
                    ? "border-red-900 border"
                    : "primary-border focus:border-green-500"
                    }`}
                  placeholder="Confirm"
                />
                <div
                  className="absolute inset right-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-white"
                  onClick={() =>
                    setShowPassword(v => !v)
                  }
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </div>
              </div>
            </div>
            {error ? <div className="text-red-500 text-sm">{error}</div> : null}
            <button disabled={isSubmitting} type="submit" className="w-full bg-green-500 bg-primary rounded-lg text-black font-normal py-3 rounded hover-shadow focus:outline-none">SWITCH</button>
          </div>
        </Form>
      )}
    </Formik>
  )
}

const LoginDetails = ({ user, onClose }) => {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState()

  const handleSubmit = (values, { setSubmitting }) => {
    axios.get('/api/users', { params: { id: user.roleData.linkedUserId } }).then(async res => {
      const email = res.data[0]?.email
      if (!email) return setError('Email not found')

      const result = await signIn("credentials", {
        email: email,
        password: values.password,
        redirect: false,
      })

      if (!result.error) {
        router.push('/dashboard')
        onClose()
      } else {
        setError(result.status === 401 ? "Invalid email or password" : result.error);
      }
      setSubmitting(false)
    }).catch(() => {
      setError('Error fetching linked user account')
      setSubmitting(false)
    })
  }

  const schema = Yup.object().shape({
    password: Yup.string().required("Required"),
  });

  return (
    <Formik
      initialValues={{
        password: '',
      }}
      validationSchema={schema}
      onSubmit={handleSubmit}
    >
      {({ errors, touched, isSubmitting }) => (
        <Form className="w-full p-8 flex items-center">
          <div className="flex flex-col w-full gap-8">
            <div>
              <div className="mb-1 opacity-45">
                <label htmlFor="">Enter Password for {user?.role === 'trainer' ? 'Staff' : 'Trainer'} Account</label>
              </div>
              <div className="relative">
                <Field
                  name="password"
                  type={showPassword ? "text" : "password"}
                  className={`w-full py-3 px-3 dark-blue-background rounded-lg text-primary focus:outline-none placeholder:opacity-45 ${errors.password && touched.password
                    ? "border-red-900 border"
                    : "primary-border focus:border-green-500"
                    }`}
                  placeholder="Enter password"
                />
                <div
                  className="absolute inset right-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-white"
                  onClick={() => setShowPassword(v => !v)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </div>
              </div>
            </div>
            {error ? <div className="text-red-500 text-sm">{error}</div> : null}
            <button disabled={isSubmitting} type="submit" className="w-full bg-green-500 bg-primary rounded-lg text-black font-normal py-3 rounded hover-shadow focus:outline-none">SWITCH</button>
          </div>
        </Form>
      )}
    </Formik>
  )
}

const SwitchAccountModal = ({ open, onClose }) => {
  const { user } = useApp()

  return (
    <Modal open={open} onClose={onClose} aria-labelledby="upload-modal-title">
      <Box
        sx={style}
        className="w-full max-w-2xl flex justify-center"
        style={{ backgroundColor: "rgba(9, 15, 33, 1)" }}
      >
        <IconButton className="!primary-border-parrot"
          style={{ position: "absolute", top: 20, right: 20, color: "#fff", padding: "3px" }}
          onClick={onClose}
        >
          <CloseIcon />
        </IconButton>
        {!user ? <CircularProgress /> :
          user.roleData.linkedUserId ? <LoginDetails user={user} onClose={onClose} /> : <RegisterAccount user={user} onClose={onClose} />
        }
      </Box>
    </Modal>
  )
}

const ProfileMenu = () => {
  const { user } = useApp()
  const [anchorElUser, setAnchorElUser] = useState(null);
  const { data: session } = useSession();
  const [openSwitchAccount, setOpenSwitchAccount] = useState(false)
  const router = useRouter();

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.replace("/login");
    Cookies.remove("loggedin");
  };

  return (
    <Box sx={{ flexGrow: 0 }}>
      <Tooltip title="Open settings">
        <IconButton
          onClick={(e) => setAnchorElUser(e.currentTarget)}
          sx={{ p: 0.5, bgcolor: "white", ":hover": { bgcolor: "white" } }}
        >
          <Person fontSize="medium" />
        </IconButton>
      </Tooltip>
      <Menu
        sx={{ mt: "45px" }}
        id="menu-appbar"
        anchorEl={anchorElUser}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        keepMounted
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        open={Boolean(anchorElUser)}
        onClose={() => setAnchorElUser(null)}
      >
        <MenuItem
          disableRipple
          sx={{ display: session?.user?.role === "staff" || user?.roleData.linkedUserId ? "flex" : "none" }}
        >
          <Grid container flexDirection={"column"} gap={1}>
            <Grid item>
              <Typography textAlign="center" color={"white"}>
                Viewing As
              </Typography>
            </Grid>
            <Grid item container gap={1}>
              <Grid item>
                <Button
                  variant={
                    session?.user?.role === "staff" ? "contained" : "outlined"
                  }
                  size="small"
                  onClick={() => setOpenSwitchAccount(true)}
                >
                  Staff
                </Button>
              </Grid>
              <Grid item>
                <Button
                  variant={
                    session?.user?.role === "trainer" ? "contained" : "outlined"
                  }
                  size="small"
                  onClick={() => setOpenSwitchAccount(true)}
                >
                  Trainer
                </Button>
              </Grid>
            </Grid>
          </Grid>
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleLogout();
            setAnchorElUser(null);
          }}
        >
          <Typography textAlign="center" color={"white"}>
            Logout
          </Typography>
          <FiLogOut className="text-primary text-lg cursor-pointer ml-2" />
        </MenuItem>
      </Menu>
      <SwitchAccountModal open={openSwitchAccount} onClose={() => setOpenSwitchAccount(false)} />
    </Box >
  );
};

const NotificationsMenu = () => {
  const { user } = useApp()
  const router = useRouter()
  const [notifications, setNotifications] = useState()

  const interval = useRef()
  useEffect(() => {
    fetchData()

    interval.current = setInterval(fetchData, 60 * 1000);

    return () => {
      clearTimeout(interval.current)
    }
  }, [])

  const fetchData = () => {
    axios.get('/api/notifications').then(res => setNotifications(res.data)).catch(console.error)
  }

  const markAsRead = () => {
    axios.patch('/api/notifications/isRead').catch(console.error)
  }

  const [anchorEl, setAnchorEl] = useState(null);

  const handleClick = (event) => {
    markAsRead()
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    fetchData()
    setAnchorEl(null);
  };

  return (
    <>
      <IconButton onClick={handleClick}>
        <Badge badgeContent={notifications?.filter(n => !n.isRead).length} color="primary">
          <IoNotificationsOutline className="text-primary text-3xl cursor-pointer" />
        </Badge>
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        sx={{
          maxHeight: '50vh',
          minWidth: '50vw',
          overflow: 'auto'
        }}
      >
        {!notifications ? <CircularProgress /> :
          notifications.length == 0 ? <p>No notifications at this moment</p> :
            notifications.sort((a, b) => new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime()).map(notification => (
              <MenuItem onClick={() => {
                if (notification.type === 'video') {
                  if (user.role === 'player') router.push('/history')
                  if (user.role === 'trainer') router.push('/players-history')
                }
                handleClose()
              }} sx={{ minWidth: '20vw' }}>
                <Grid container alignItems={'center'} gap={2}>
                  <Grid item>
                    {notification.type === 'video' && <VideoCameraBack color={notification.isRead ? "white" : "primary"} />}
                  </Grid>
                  <Grid item container xs='auto' flexDirection={'column'} gap={2}>
                    <Grid item>
                      <p className={`text-white ${!notification.isRead && 'font-bold text-primary'}`}>
                        {notification.message}
                      </p>
                    </Grid>
                    <Grid item>
                      <p className={`text-sm text-white ${!notification.isRead && 'font-bold'}`}>
                        {new Date(notification.creationDate).getTime() < new Date(new Date().setHours(0, 0, 0, 0)).getTime() ? new Date(notification.creationDate).toLocaleString() : new Date(notification.creationDate).toLocaleTimeString()}
                      </p>
                    </Grid>
                  </Grid>
                </Grid>
              </MenuItem>
            ))
        }
      </Menu >
    </>
  );
}

const Layout = ({ children }) => {
  const router = useRouter();
  const user = useSession().data?.user || {};
  const pathname = usePathname();
  const [showSidebar, setShowSidebar] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [showUpdateEmailModal, setShowUpdateEmailModal] = useState(false);

  useEffect(() => {
    if (!user.role) router.replace("/login");
    else if (!user.emailVerified)
      setSnackbarOpen(true);
  }, [user]);

  useEffect(() => {
    setShowSidebar(false);
  }, [pathname]);

  return (
    <div className="flex flex-row h-screen">
      <div className="z-20 w-fit">
        <Sidebar showSidebar={showSidebar} setShowSidebar={setShowSidebar} />
      </div>
      {showSidebar && (
        <div
          onClick={() => setShowSidebar(false)}
          className={`bg-black opacity-50 absolute w-screen h-screen z-10 top-0 left-0 right-0 bottom-0`}
        ></div>
      )}
      <div className="flex-1 px-0 py-0 md:py-8 md:px-8 dashboard-background w-4/5 h-screen overflow-auto">
        <div className={`${showSidebar ? 'bg-transparent' : 'bg-gray-900'} md:bg-transparent flex justify-between md:justify-end align-center mb-2 md:mb-8 sticky md:relative top-0 px-4 md:px-0 py-2 md:py-0 z-10`}>
          <div className={`${showSidebar ? 'hidden' : 'flex'} md:hidden item-center items-center`}>
            <IconButton disableRipple onClick={() => setShowSidebar(true)} sx={{ margin: 0, padding: 0.5 }}>
              <MenuIcon sx={{ color: '#ffffff' }} />
            </IconButton>
          </div>
          <div className="flex justify-between items-center gap-2 md:gap-4">
            <div>
              <button
                disabled={!user.emailVerified}
                onClick={() => setShowUploadModal(true)}
                className={`bg-white text-xs md:text-base text-black px-4 md:px-5 py-1 rounded-lg ${user.role !== "player" && "hidden"}`}
              >
                UPLOAD
              </button>
            </div>
            <div>
              <button
                disabled={!user.emailVerified}
                onClick={() => router.push('/purchases')}
                className={`bg-white text-xs md:text-base text-black px-4 md:px-5 py-1 rounded-lg ${['staff', 'admin'].includes(user.role) && "hidden"}`}
              >
                PURCHASE
              </button>
            </div>
            <div>
              <NotificationsMenu />
            </div>
            <div>
              <ProfileMenu key={"ProfileMenu"} />
            </div>
          </div>
        </div>
        <div className="-mt-0 lg:-mt-[65px] px-4 md:px-0">
          {((user.role === "trainer" &&
            [
              "/dashboard",
              "/add-player",
              "/players-history",
              "/players-metrics",
              "/metrics",
            ].includes(pathname)) ||
            (user.role === "player" && ["/dashboard"].includes(pathname)) ||
            (user.role === "staff" &&
              ["/dashboard", "/users", "/users/view"].includes(pathname)) ||
            (user.role === "admin" &&
              ["/dashboard", "/users", "/users/view"].includes(pathname))) && (
              <div>
                <HeaderProfile />
              </div>
            )}
          {children}
        </div>
      </div>
      {showUploadModal && <UploadModal open={showUploadModal} onClose={() => setShowUploadModal(false)} type={'upload'} onSuccess={() => setShowUploadModal(false)} />}

      <Snackbar
        open={snackbarOpen}
        onClose={() => setSnackbarOpen(false)}
        onClick={() => setShowUpdateEmailModal(true)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        sx={{ cursor: "pointer", paddingX: 1 }}
      >
        <SnackbarContent
          message={
            <span
              className="text-yellow-300"
              style={{ display: "flex", alignItems: "center" }}
            >
              <WarningIcon
                style={{ marginRight: 8 }}
                className="text-yellow-300"
              />
              Please verify your email
            </span>
          }
          action={
            <IconButton color="inherit">
              <ArrowForwardIcon />
            </IconButton>
          }
          sx={{
            width: "100%",
            backgroundColor: "black",
            color: "white",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow:
              "0px 3px 5px -1px rgba(0,0,0,0.2), 0px 6px 10px 0px rgba(0,0,0,0.14), 0px 1px 18px 0px rgba(0,0,0,0.12)",
          }}
        />
      </Snackbar>
      {showUpdateEmailModal && <UpdateEmailModal open={showUpdateEmailModal} onClose={() => setShowUpdateEmailModal(false)} isVerification={user.emailVerified ? false : true} />}
      <PromoCodesPopup />
    </div>
  );
};

export default Layout;

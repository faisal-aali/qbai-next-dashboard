"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import profileStyle from './sidebar.module.css';
import { useSession } from "next-auth/react";
import { useApp } from "../Context/AppContext";
import { Badge } from "@mui/material";

const Sidebar = ({ showSidebar, setShowSidebar }) => {
  const userSession = useSession().data?.user || {};
  const pathname = usePathname();
  const route = useRouter();
  const searchParams = useSearchParams();
  const { user, unreadTickets } = useApp();

  const linkClasses = (path, pathValidator, disabled) =>
    `flex pl-2 py-1 ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${(pathValidator
      ? pathValidator(pathname, searchParams)
      : pathname.startsWith(path)) && !disabled
      ? "bg-primary rounded-lg min-w-[200px] w-fit items-center text-black"
      : "text-white"
    }`;

  const svgClasses = (path, pathValidator, disabled) =>
    `${disabled ? "opacity-50 cursor-not-allowed" : ""} ${(pathValidator
      ? pathValidator(pathname, searchParams)
      : pathname.startsWith(path)) && !disabled
      ? "mix-blend-difference"
      : "fill-current text-white"
    }`;

  const links = [
    {
      url: '/dashboard',
      icon: '/assets/dashboard-icon.svg',
      label: 'Dashboard',
      roles: ['player', 'trainer', 'staff'],
      needVerification: false
    },
    {
      url: '/leaderboard',
      icon: '/assets/leaderboard-icon.svg',
      label: 'Leaderboard',
      roles: ['player', 'trainer', 'staff', 'admin'],
      needVerification: false
    },
    {
      url: '/drill-library',
      icon: '/assets/drill-library-icon.svg',
      label: 'Drill Library',
      roles: ['player', 'trainer', 'staff', 'admin'],
      needVerification: true
    },
    {
      url: '/add-player',
      icon: '/assets/add-player-icon.svg',
      label: 'Manage Players',
      roles: ['trainer'],
      needVerification: true
    },
    {
      url: '/metrics',
      icon: '/assets/metrics-icon.svg',
      label: 'My Metrics',
      roles: ['player'],
      needVerification: true
    },
    {
      url: '/players-metrics',
      icon: '/assets/metrics-icon.svg',
      label: 'My Player Metrics',
      roles: ['trainer'],
      needVerification: true,
      pathValidator: function (pathname, searchParams) {
        return (pathname.startsWith(this.url) || pathname.startsWith('/metrics'))
      }
    },
    {
      url: '/history',
      icon: '/assets/history-icon.svg',
      label: 'History',
      roles: ['player'],
      needVerification: true
    },
    {
      url: '/players-history',
      icon: '/assets/history-icon.svg',
      label: 'My Player History',
      roles: ['trainer'],
      needVerification: true
    },
    {
      url: '/users',
      query: '?role=player',
      icon: `/assets/${userSession.role === 'staff' ? 'players-database-icon.svg' : userSession.role === 'admin' ? 'add-player-icon.svg' : ''}`,
      label: userSession.role === 'staff' ? 'Players Database' : userSession.role === 'admin' ? 'Manage Player Database' : 'Invalid role',
      roles: ['staff', 'admin'],
      needVerification: true,
      pathValidator: function (pathname, searchParams) {
        // const query = Object.fromEntries(searchParams.entries());
        // const path = pathname + `?${Object.keys(query).map(k => `${k}=${query[k]}`).join('&')}`;
        return (pathname.startsWith(this.url) && searchParams.get('role') === 'player');
      }
    },
    {
      url: '/users',
      query: '?role=staff',
      icon: '/assets/add-player-icon.svg',
      label: 'Manage Staff Database',
      roles: ['admin'],
      needVerification: true,
      pathValidator: function (pathname, searchParams) {
        // const query = Object.fromEntries(searchParams.entries());
        // const path = pathname + `?${Object.keys(query).map(k => `${k}=${query[k]}`).join('&')}`;
        // return (path.startsWith(this.url) && path.endsWith(this.query));
        return (pathname.startsWith(this.url) && searchParams.get('role') === 'staff')
      }
    },
    {
      url: '/users',
      query: '?role=trainer',
      icon: '/assets/add-player-icon.svg',
      label: 'Manage Trainer Database',
      roles: ['admin'],
      needVerification: true,
      pathValidator: function (pathname, searchParams) {
        // const query = Object.fromEntries(searchParams.entries());
        // const path = pathname + `?${Object.keys(query).map(k => `${k}=${query[k]}`).join('&')}`;
        // return (path.startsWith(this.url) && path.endsWith(this.query));
        return (pathname.startsWith(this.url) && searchParams.get('role') === 'trainer')
      }
    },
    {
      url: '/update-calendar',
      icon: '/assets/calender-icon.svg',
      label: 'Update Calendar',
      roles: ['admin'],
      needVerification: true
    },
    {
      url: '/coaching-call',
      icon: '/assets/phone-call-icon.svg',
      label: 'Coaching Call',
      roles: ['player'],
      needVerification: true
    },
    {
      url: '/purchases',
      icon: '/assets/purchase-icon.svg',
      label: 'Purchases',
      roles: ['player', 'trainer'],
      needVerification: true
    },
    {
      url: '/subscriptions',
      icon: '/assets/subscription-icon.svg',
      label: 'Subscriptions',
      roles: ['player', 'trainer'],
      needVerification: true
    },
    {
      url: '/promo-codes',
      icon: '/assets/promo-codes.svg',
      label: 'Promo Codes',
      roles: ['admin'],
      needVerification: true
    },
    {
      url: '/requests',
      icon: '/assets/requests.svg',
      label: 'Requests',
      roles: ['admin'],
      needVerification: true
    },
    {
      url: '/feedback',
      icon: '/assets/support-icon.svg',
      label: 'Support & Feedback',
      roles: ['player', 'trainer', 'staff', 'admin'],
      needVerification: false,
      badgeContent: unreadTickets.count
    },
    {
      url: '/settings',
      icon: '/assets/setting-icon.svg',
      label: 'Settings',
      roles: ['player', 'trainer', 'staff', 'admin'],
      needVerification: false
    },
  ];

  return (
    <div className={`${showSidebar ? 'bg-gray-900' : 'bg-transparent'} md:bg-gray-900 pt-8 ${showSidebar ? 'absolute' : 'hidden'} md:flex h-screen overflow-auto p-4 ${showSidebar ? 'w-80' : 'w-fit'} md:w-80 ${showSidebar ? 'pl-12' : 'pl-4'} md:pl-12 ${showSidebar ? 'absolute' : 'unset'} md:unset`}>
      <div className={`${showSidebar ? 'flex' : 'hidden'} md:flex`}>
        <div className="w-62">
          <div className="flex items-center mb-6">
            <img src="/assets/qbai-log.png" alt="Logo" className="w-48" />
          </div>
          <div className={`${(userSession.role === 'staff' || userSession.role === 'admin') && profileStyle.profile} flex items-center space-x-2 mb-8 rounded-lg ${pathname === '/profile' && `bg-primary p-2`}`} onClick={(userSession.role === 'staff' || userSession.role === 'admin') && (() => route.replace('/profile')) || undefined}>
            <img
              src={user?.avatarUrl ? user.avatarUrl : "https://placehold.co/100x100"}
              alt="User Avatar"
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <p className={`font-semibold ${pathname === '/profile' && 'text-black'}`}>{user?.name} ({user?.role})</p>
              <p className={`text-sm ${pathname === '/profile' ? 'text-black' : 'text-zinc-400'}`}>{user?.email}</p>
            </div>
          </div>
          <div className="mb-8">
            <input
              type="text"
              placeholder="Search..."
              className="w-10/12 pl-2 py-1 dark-blue-background rounded-lg text-white h-12 search-background focus:outline-none"
            />
          </div>
          <div className="flex flex-col space-y-2">
            {links.filter(link => link.roles.includes(userSession.role)).map((link, index) => {
              const isDisabled = !user?.emailVerified && link.needVerification;
              return (
                <Link
                  key={index}
                  href={isDisabled ? "#" : `${link.url}${link.query || ''}`}
                  onClick={(e) => isDisabled && e.preventDefault()}
                  className={linkClasses(link.url, link.pathValidator?.bind(link), isDisabled)}
                >
                  <Badge badgeContent={link.badgeContent} color="error">
                    <img
                      src={link.icon}
                      className={svgClasses(link.url, link.pathValidator?.bind(link), isDisabled)}
                      alt=""
                      width={20}
                      height={20}
                    />
                  </Badge>
                  <span className={`flex items-center p-1.5 pl-4 text-inherit ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}>{link.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;

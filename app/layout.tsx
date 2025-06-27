import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/app/globals.css";
import { authOption } from "@/app/api/auth/[...nextauth]/route";
import AuthProvider from './AuthProvider';
import { getServerSession } from "next-auth";
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';
import theme from "./muiTheme";
import { ThemeProvider } from '@mui/material/styles';
import AppProvider from '../components/Context/AppContext';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Spin Lab AI",
  description: "A Generative ai tool",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOption)

  return (
    <html lang="en">
      <AppRouterCacheProvider>
        <AuthProvider session={session}>
          <ThemeProvider theme={theme}>
            <AppProvider>
              <body className={inter.className}>{children}</body>
            </AppProvider>
          </ThemeProvider>
        </AuthProvider>
      </AppRouterCacheProvider>
    </html>
  );
}

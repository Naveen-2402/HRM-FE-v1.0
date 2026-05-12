import "./globals.css";
import type { Metadata } from "next";
import { ThemeProvider } from "../components/theme-provider";
import { Providers } from "./providers";
import { ToastContainer } from 'react-toastify';
import { AuthGuard } from "@/components/auth-guard";
import { Plus_Jakarta_Sans } from "next/font/google";

const fontSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
});

export const metadata: Metadata = {
  title: "HRM Platform",
  description: "Modern HR Management",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${fontSans.variable} font-sans tracking-wide antialiased bg-background text-foreground`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Providers>
            <AuthGuard>
              {children}
            </AuthGuard>
            <ToastContainer 
              position="bottom-right" 
              theme="colored" 
              autoClose={3000} 
            />
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
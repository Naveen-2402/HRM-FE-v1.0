import "./globals.css";
import type { Metadata } from "next";
import { ThemeProvider } from "../components/theme-provider";
import { Providers } from "./providers";
import { ToastContainer } from 'react-toastify';
import { AuthGuard } from "@/components/auth-guard";

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
      <body className="antialiased">
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
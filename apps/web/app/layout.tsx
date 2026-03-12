import "./globals.css";
import type { Metadata } from "next";
import { ThemeProvider } from "../components/theme-provider";
import { Providers } from "./providers";

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
            {children}
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
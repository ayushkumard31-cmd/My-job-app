import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/lib/store";
import { AuthProvider } from "@/lib/auth";
import AppShell from "@/components/AppShell";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const inter = Inter({ variable: "--font-inter", subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });

export const metadata = {
  title: "Campus Compass — Student Life Planner",
  description:
    "A personalised daily routine for engineering students, built around your goals, subjects and hobbies.",
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f4f7" },
    { media: "(prefers-color-scheme: dark)", color: "#07090e" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      data-accent="indigo"
      className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} dark h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full font-sans">
        {/* AuthProvider sits outside AppProvider — the store's cloud sync reads
            the signed-in user from it. */}
        <AuthProvider>
          <AppProvider>
            <AppShell>{children}</AppShell>
          </AppProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

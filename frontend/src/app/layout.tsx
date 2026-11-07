import type { Metadata } from "next";
import type { ReactNode } from "react";
import "../course-artwork.css";
import SiteShell from "../layout/SiteShell";
import { AcademyProvider } from "../providers/AcademyProvider";
import ThemeProvider from "../providers/ThemeProvider";
import "../styles.css";
import "../auth.css";
import "../learning.css";
import "../admin-library.css";
import "../theme.css";
import "../overview.css";
import "../profile.css";
import "../people.css";
import "../certificates.css";
import "../announcements.css";
export const metadata: Metadata = {
  title: {
    default: "MOWE Academy | Certified Business Administrator",
    template: "%s | MOWE Academy",
  },
  description:
    "Build practical business skills with MOWE Global’s three-course Certified Business Administrator program.",
  icons: { icon: "/favicon.svg" },
};
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      data-theme="light"
      suppressHydrationWarning
    >
      <head>
        <script
          id="mowe-theme-initializer"
          dangerouslySetInnerHTML={{
            __html:
              'try{document.documentElement.dataset.theme=localStorage.getItem("mowe-theme")==="dark"?"dark":"light"}catch{document.documentElement.dataset.theme="light"}',
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          <AcademyProvider>
            <SiteShell>{children}</SiteShell>
          </AcademyProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

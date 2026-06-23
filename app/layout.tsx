import "./globals.css";
import localFont from "next/font/local";
import { Toaster } from "sonner";

const satoshi = localFont({
  src: [
    {
      path: "../fonts/Satoshi-Regular.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/Satoshi-Medium.otf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../fonts/Satoshi-Bold.otf",
      weight: "700",
      style: "normal",
    },
  ],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={satoshi.className}>{children}</body>
      <Toaster richColors />
    </html>
  );
}
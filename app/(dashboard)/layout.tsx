"use client";

import { useState, useEffect } from "react";
import { createContext } from "react";

import Sidebar from "@/components/dashboard/sidebar";
import TopNavbar from "@/components/dashboard/top-navbar";

type MeetingContextType = {
  inMeeting: boolean;
  setInMeeting: (value: boolean) => void;

  sidebarOpen: boolean;
  setSidebarOpen: React.Dispatch<
    React.SetStateAction<boolean>
  >;
};

export const MeetingContext =
  createContext<MeetingContextType>({
    inMeeting: false,
    setInMeeting: () => { },

    sidebarOpen: false,
    setSidebarOpen: () => { },
  });

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [inMeeting, setInMeeting] = useState(false);

  const [isMobile, setIsMobile] = useState<boolean | null>(null);

useEffect(() => {
  const checkScreen = () => {
    setIsMobile(window.innerWidth < 1024);
  };

  checkScreen();

  window.addEventListener("resize", checkScreen);

  return () =>
    window.removeEventListener("resize", checkScreen);
}, []);

const shouldSidebarBeOpen =
  isMobile === null
    ? false
    : isMobile
      ? sidebarOpen
      : inMeeting
        ? sidebarOpen
        : true;

  return (
    <MeetingContext.Provider
      value={{
        inMeeting,
        setInMeeting,

        sidebarOpen,
        setSidebarOpen,
      }}
    >

      <div className="min-h-screen bg-[#faf8ff] text-gray-950 transition-colors dark:bg-[#0f1020] dark:text-white">
        <Sidebar
  isOpen={shouldSidebarBeOpen}
  onClose={() => setSidebarOpen(false)}
  inMeeting={inMeeting}
/>

        {/* <div
          className={`
            min-h-dvh

            ${inMeeting
              ? (
                sidebarOpen
                  ? "lg:ml-64"
                  : ""
              )
              : "lg:ml-64"
            }
          `}
        > */}

        <div
          className={`
    min-h-dvh
    ${!inMeeting
              ? "lg:ml-64"
              : sidebarOpen
                ? "lg:ml-64"
                : ""
            }
  `}
        >
          {/* {
            !inMeeting && (
              <TopNavbar
                onMenuClick={() =>
                  setSidebarOpen((prev) => !prev)
                }
              />
            )
          } */}
          <TopNavbar
            onMenuClick={() => setSidebarOpen((prev) => !prev)}
          />

          <main className="min-h-dvh px-4 pt-20 pb-6 sm:px-6 lg:px-8">
            {/* <main
            className={`min-h-dvh pb-6 ${inMeeting
                ? ""
                : "px-4 pt-20 sm:px-6 lg:px-8"
              }`}
          > */}
            {children}
          </main>
        </div>
      </div>
    </MeetingContext.Provider>
  );
}

"use client";

import { supabaseClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { Bell, Moon, Search, Menu } from "lucide-react";
import { Button } from "../ui/button";
import NotificationPanel from "./notification-panel";
import { useContext } from "react";
import { MeetingContext } from "@/app/(dashboard)/layout";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Video, ArrowRight } from "lucide-react";

interface TopNavbarProps {
  onMenuClick: () => void;
}

export default function TopNavbar({
  onMenuClick,
}: TopNavbarProps) {

  const {
    inMeeting,
    sidebarOpen,
    setSidebarOpen,
  } = useContext(MeetingContext);

  const [notifOpen, setNotifOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const router = useRouter();

  // Fetch user from supabase
  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabaseClient.auth.getUser();

      if (!user) return;

      setUser(user);

      const { data: profile } = await supabaseClient
        .from("profiles")
        .select("role, full_name")
        .eq("id", user.id)
        .single();

      setProfile(profile);
    };

    loadUser();
  }, []);

  // Get Initials
  const getInitials = (full_name: string) => {
    return full_name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  useEffect(() => {
    if (!user?.id) return;

    const fetchNotifications = async () => {
      const { data, error } = await supabaseClient
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error) {
        setNotifications(data || []);
      }
    };

    fetchNotifications();
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabaseClient
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotification = payload.new;

          setNotifications((prev) => [
            newNotification,
            ...prev,
          ]);

          toast.custom(
            (t) => (
              <div
                className="
        w-[350px]
        rounded-2xl
        border border-white/40
        bg-white/80
        backdrop-blur-xl
        shadow-2xl
        p-4
      "
              >
                <div className="flex items-start gap-3">

                  <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center">
                    <Video size={18} />
                  </div>

                  <div className="flex-1">

                    <h3 className="font-semibold text-sm text-gray-800">
                      Meeting Invitation
                    </h3>

                    <p className="text-xs text-gray-600 mt-1">
                      <span className="font-medium">
                        {newNotification.sender_name}
                      </span>{" "}
                      invited you to join a meeting.
                    </p>

                    <div className="mt-2 text-xs text-gray-500">
                      Meeting ID:
                      <span className="ml-1 font-medium">
                        {newNotification.meeting_id}
                      </span>
                    </div>

                    <button
                      className="
              mt-3
              flex items-center gap-2
              px-3 py-1.5
              rounded-lg
              bg-primary
              text-white
              text-xs
            "
                      onClick={() => {
                        toast.dismiss(t);
                        router.push(
                          `/meet?join=${newNotification.meeting_id}`
                        );
                      }}
                    >
                      Join Now
                      <ArrowRight size={14} />
                    </button>

                  </div>

                </div>
              </div>
            ),
            {
              duration: 10000,
            }
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const updated = payload.new;

          setNotifications((prev) =>
            prev.map((n) =>
              n.id === updated.id ? updated : n
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, [user?.id]);

  return (

    <header
      className={`
      fixed top-0 right-0 left-0 z-30 h-20
      border-b border-white/30
      bg-white/70 backdrop-blur-xl

      ${inMeeting
          ? (
            sidebarOpen
              ? "lg:left-64"
              : "lg:left-0"
          )
          : "lg:left-64"
        }
      `}
    >

      <div className="flex h-full items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* <button
            onClick={() => setSidebarOpen(prev => !prev)}
            className="
            flex items-center justify-center
            w-9 h-9
            rounded-lg
            bg-white/10
            hover:bg-white/20
            transition
            "
          >
            <Menu size={18} />
          </button> */}

        <Button
          variant="ghost"
          size="icon"
          className={`
          ${inMeeting ? "flex" : "lg:hidden"}
          `}
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="hidden md:block relative w-full max-w-md">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            type="text"
            placeholder="Search users..."
            className="w-full rounded-full border border-gray-200 bg-white/50 py-3 pl-11 pr-4 outline-none transition focus:border-indigo-400"
          />
        </div>

        <div className="flex items-center gap-3 sm:gap-5">

          <button
            onClick={() => setNotifOpen(true)}
            className="relative"
          >
            <Bell className="text-gray-600" />

            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          <button>
            <Moon className="text-gray-600" />
          </button>

          <div className="flex items-center gap-3">

            {/* USER INFO */}
            <div className="hidden sm:flex flex-col text-right leading-tight">

              {/* NAME */}
              <p
                className="font-semibold text-sm text-gray-900 max-w-[140px] truncate"
                title={profile?.full_name}
              >
                {profile?.full_name || "User"}
              </p>

              {/* ROLE */}
              <p className="text-xs text-gray-500 capitalize">
                {profile?.role || "user"}
              </p>
            </div>

            {/* AVATAR */}
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-semibold uppercase">
              {profile?.full_name?.charAt(0) || "U"}
            </div>

          </div>

        </div>

      </div>

      {/* <NotificationPanel
        userId={user?.id}
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
      /> */}


      <NotificationPanel
        userId={user?.id}
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        onJoinMeeting={(meetingId) => {
          setNotifOpen(false)
          router.push(`/meet?join=${meetingId}`);
        }}
      />
    </header>
  );
}
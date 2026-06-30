"use client";

import { useEffect, useState } from "react";
import { supabaseClient } from "@/lib/supabase/client";
import { Video } from "lucide-react";
import { useRef } from "react";

type Notification = {
  id: string;
  title: string;
  message: string;
  meeting_id: string;
  read: boolean;
  created_at: string;
  sender_name: string;
};

export default function NotificationPanel({
  userId,
  open,
  onClose,
  onJoinMeeting,
}: {
  userId: string;
  open: boolean;
  onClose: () => void;
  onJoinMeeting?: (meetingId: string) => void;
}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
  if (!open) return;

  const handleClickOutside = (e: MouseEvent) => {
    if (!panelRef.current) return;

    if (!panelRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  document.addEventListener("mousedown", handleClickOutside);

  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, [open, onClose]);

  useEffect(() => {
    if (!open || !userId) return;

    const fetchNotifications = async () => {
      const { data } = await supabaseClient
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      setNotifications(data || []);

      await supabaseClient
  .from("notifications")
  .update({ read: true })
  .eq("user_id", userId)
  .eq("read", false);
    };

    fetchNotifications();
  }, [open, userId]);

  const markAllAsRead = async () => {
    await supabaseClient
      .from("notifications")
      .update({ read: true })
      .eq("user_id", userId)
      .eq("read", false);

    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read: true }))
    );
  };

  const markAsRead = async (id: string) => {
    await supabaseClient
      .from("notifications")
      .update({ read: true })
      .eq("id", id);

    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  if (!open) return null;

 return (
  <>
    {/* BACKDROP */}
    <div
      className="fixed inset-0 z-40"
      onClick={onClose}
    />

    {/* PANEL */}
    <div
      ref={panelRef}
      className="
        fixed
        right-2 top-16
        z-50
        flex flex-col
        overflow-hidden
        rounded-xl
        border border-white/40
        bg-white/100
        dark:border-white/10
        dark:bg-[#19172b]/95
        shadow-2xl
        backdrop-blur-xl
        w-[80vw]

        w-[calc(100vw-1rem)]
        max-w-[380px]

        sm:right-4
        sm:top-20

        md:right-6
      "
    >
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-gray-200/40 px-4 py-3 dark:border-white/10">
        <h2 className="font-semibold text-gray-800 dark:text-white">
          Notifications
        </h2>

        <button
            onClick={markAllAsRead}
            className="text-sm text-primary hover:text-primary"
          >
            Mark all as read
          </button>
      </div>

      {/* BODY */}
      <div className="max-h-[60vh] overflow-y-auto no-scrollbar sm:max-h-[320px]">
        {notifications.length === 0 ? (
          <p className="p-4 text-sm text-gray-500 dark:text-white/55">
            No notifications yet
          </p>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={(e) => {
                // ignore clicks coming from button
                const target = e.target as HTMLElement;
                if (target.closest("button")) return;

                markAsRead(n.id);
              }}
              className={`
                px-4 py-3 cursor-pointer border-l-4 transition
                ${
                  n.read
                    ? "border-gray-300 bg-white/40 opacity-70 dark:border-white/15 dark:bg-white/5"
                    : "border-primary bg-purple-50/40 dark:bg-primary/10"
                }
              `}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold text-gray-800 dark:text-white">
                  {n.title}
                </p>

                <span className="shrink-0 text-xs text-gray-400 dark:text-white/40">
                  {new Date(n.created_at).toLocaleTimeString("en-US", {
                    timeZone: "Asia/Karachi",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              <p className="mt-1 text-xs text-gray-600 dark:text-white/65">
                {n.message}
              </p>

              <div className="mt-2 flex items-center gap-2 text-xs text-gray-500 dark:text-white/50">
                <Video size={15} />
                <span>Meeting ID:</span>

                <span className="font-medium break-all">
                  {n.meeting_id}
                </span>
              </div>

              <div className="text-xs text-gray-500 dark:text-white/50">
                From:
                <span className="ml-1 font-medium">
                  {n.sender_name}
                </span>
              </div>

              <div className="mt-3 flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // prevents markAsRead trigger
                    onJoinMeeting?.(n.meeting_id);
                  }}
                  className="
                    rounded-lg
                    bg-primary
                    px-3 py-1
                    text-xs
                    text-white
                  "
                >
                  Join Now
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* FOOTER */}
      <div className="border-t border-gray-200/40 p-3 text-center dark:border-white/10">
        <span className="text-sm text-gray-500 dark:text-white/50">
          Total notifications:{" "}
          <span className="font-medium text-gray-700 dark:text-white/75">
            {notifications.length}
          </span>
        </span>
      </div>
    </div>
  </>
);
}

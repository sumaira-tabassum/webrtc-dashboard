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
        fixed right-6 top-20 z-50
        w-[380px]
        rounded-xl
        bg-white/100
        backdrop-blur-xl
        border border-white/40
        shadow-2xl
        flex flex-col
        overflow-hidden
      "
      >

        {/* HEADER */}
        <div className="px-4 py-3 border-b border-gray-200/40 flex justify-between items-center">
          <h2 className="font-semibold text-gray-800">
            Notifications
          </h2>

          <button
            onClick={markAllAsRead}
            className="text-sm text-primary hover:text-primary"
          >
            Mark all as read
          </button>
        </div>


        <div className="max-h-[320px] overflow-y-auto no-scrollbar">
          {notifications.length === 0 ? (
            <p className="p-4 text-sm text-gray-500">
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
                  ${n.read
                    ? "border-gray-300 bg-white/40 opacity-70"
                    : "border-primary bg-purple-50/40"
                  }
                `}
              >
                <div className="flex justify-between">
                  <p className="font-semibold text-sm text-gray-800">
                    {n.title}
                  </p>
                  <span className="text-xs text-gray-400">
                    {new Date(n.created_at).toLocaleTimeString('en-US', {
                      timeZone: 'Asia/Karachi', hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>

                <p className="text-xs text-gray-600 mt-1">
                  {n.message}
                </p>

                <div className="text-xs text-gray-500 mt-2 flex items-center gap-2">
                  <Video size={15}></Video>
                  <span>Meeting ID:</span>
                  <span className="font-medium">
                    {n.meeting_id}
                  </span>
                </div>

                <div className="text-xs text-gray-500">
                  From:
                  <span className="font-medium ml-1">
                    {n.sender_name}
                  </span>
                </div>

                <div className="mt-3 flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // prevents markAsRead trigger
                      onJoinMeeting?.(n.meeting_id);
                    }}
                    className="px-3 py-1 text-xs rounded-lg bg-primary text-white"
                  >
                    Join Now
                  </button>
                </div>

              </div>
            ))
          )}
        </div>

        <div className="border-t border-gray-200/40 p-3 text-center">
          <button className="text-sm text-gray-600 hover:text-primary">
            View all notifications
          </button>
        </div>
      </div>
    </>
  );
}

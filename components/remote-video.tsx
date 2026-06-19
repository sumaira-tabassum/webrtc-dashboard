"use client";

import { useEffect, useRef } from "react";

type Props = {
  stream: MediaStream;
  name: string;
  muted?: boolean;
};

export default function RemoteVideo({
  stream,
  name,
  muted = false,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative overflow-hidden rounded-xl bg-black border border-white/10">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted}
        className="w-full h-full object-cover"
      />

      <div className="absolute bottom-2 left-2 text-xs text-white bg-black/40 px-2 py-1 rounded">
        {name}
      </div>
    </div>
  );
}
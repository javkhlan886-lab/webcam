"use client";

import { useEffect, useRef, useState } from "react";
import { ICE_SERVERS, type SignalMessage } from "@/lib/webrtc/types";

async function postSignal(
  streamId: number,
  to: number,
  type: string,
  extra: Record<string, unknown>,
) {
  await fetch(`/api/signaling/${streamId}/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ to, type, ...extra }),
  });
}

export function LivePlayer({
  streamId,
  creatorId,
}: {
  streamId: number;
  creatorId: number;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const [status, setStatus] = useState<
    "connecting" | "connected" | "disconnected"
  >("connecting");
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const source = new EventSource(`/api/signaling/${streamId}/events`);

    source.onmessage = async (event) => {
      const message: SignalMessage = JSON.parse(event.data);
      if (message.from !== creatorId) return;

      if (message.type === "offer") {
        pcRef.current?.close();
        const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
        pcRef.current = pc;

        pc.ontrack = (e) => {
          if (videoRef.current) videoRef.current.srcObject = e.streams[0];
          setStatus("connected");
        };
        pc.onconnectionstatechange = () => {
          if (
            pc.connectionState === "disconnected" ||
            pc.connectionState === "failed" ||
            pc.connectionState === "closed"
          ) {
            setStatus("disconnected");
          }
        };
        pc.onicecandidate = (e) => {
          if (e.candidate)
            postSignal(streamId, creatorId, "ice-candidate", {
              candidate: e.candidate.toJSON(),
            });
        };

        await pc.setRemoteDescription(new RTCSessionDescription(message.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        postSignal(streamId, creatorId, "answer", { sdp: answer });
      } else if (message.type === "ice-candidate") {
        await pcRef.current?.addIceCandidate(
          new RTCIceCandidate(message.candidate),
        );
      }
    };

    return () => {
      source.close();
      pcRef.current?.close();
      pcRef.current = null;
    };
  }, [streamId, creatorId]);

  const handleUnmute = () => {
    if (videoRef.current) {
      videoRef.current.muted = false;
      videoRef.current.play().catch(() => {});
    }
    setMuted(false);
  };

  return (
    <div className="relative aspect-video overflow-hidden rounded-lg bg-black">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted}
        className="h-full w-full object-cover"
      />
      {status !== "connected" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-gray-300">
          {status === "connecting"
            ? "Connecting to stream..."
            : "Stream disconnected"}
        </div>
      )}
      {status === "connected" && muted && (
        <button
          type="button"
          onClick={handleUnmute}
          className="absolute bottom-3 right-3 rounded bg-pink-600 px-3 py-1 text-sm font-bold text-white hover:bg-pink-700"
        >
          Unmute
        </button>
      )}
    </div>
  );
}

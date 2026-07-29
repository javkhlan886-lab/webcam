"use client";

import { useRouter } from "next/navigation";
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

export function BroadcastPanel({ streamId }: { streamId: number }) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const peersRef = useRef(new Map<number, RTCPeerConnection>());
  const localStreamRef = useRef<MediaStream | null>(null);

  const [error, setError] = useState("");
  const [viewers, setViewers] = useState<{ id: number; username: string }[]>(
    [],
  );
  const [ending, setEnding] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const peers = peersRef.current;

    async function start() {
      let localStream: MediaStream;
      try {
        localStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Could not access camera/microphone",
          );
        }
        return;
      }
      if (cancelled) {
        for (const track of localStream.getTracks()) track.stop();
        return;
      }

      localStreamRef.current = localStream;
      if (videoRef.current) videoRef.current.srcObject = localStream;

      const source = new EventSource(`/api/signaling/${streamId}/events`);

      source.onmessage = async (event) => {
        const message: SignalMessage = JSON.parse(event.data);

        if (message.type === "viewer-joined") {
          const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
          for (const track of localStream.getTracks())
            pc.addTrack(track, localStream);

          pc.onicecandidate = (e) => {
            if (e.candidate)
              postSignal(streamId, message.from, "ice-candidate", {
                candidate: e.candidate.toJSON(),
              });
          };

          peers.set(message.from, pc);
          setViewers((prev) =>
            prev.some((v) => v.id === message.from)
              ? prev
              : [...prev, { id: message.from, username: message.username }],
          );

          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          postSignal(streamId, message.from, "offer", { sdp: offer });
        } else if (message.type === "answer") {
          const pc = peers.get(message.from);
          await pc?.setRemoteDescription(
            new RTCSessionDescription(message.sdp),
          );
        } else if (message.type === "ice-candidate") {
          const pc = peers.get(message.from);
          await pc?.addIceCandidate(new RTCIceCandidate(message.candidate));
        } else if (message.type === "viewer-left") {
          peers.get(message.from)?.close();
          peers.delete(message.from);
          setViewers((prev) => prev.filter((v) => v.id !== message.from));
        }
      };

      return () => source.close();
    }

    const closePromise = start();

    return () => {
      cancelled = true;
      closePromise.then((close) => close?.());
      for (const pc of peers.values()) pc.close();
      peers.clear();
      for (const track of localStreamRef.current?.getTracks() ?? [])
        track.stop();
    };
  }, [streamId]);

  const handleEndStream = async () => {
    setEnding(true);
    try {
      await fetch(`/api/streams/${streamId}/end`, { method: "POST" });
      router.push("/dashboard");
      router.refresh();
    } finally {
      setEnding(false);
    }
  };

  return (
    <div className="mb-6 overflow-hidden rounded-lg bg-black">
      <div className="relative aspect-video">
        {error ? (
          <div className="flex h-full items-center justify-center p-6 text-center text-red-400">
            {error}
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="h-full w-full object-cover"
          />
        )}
        <div className="absolute top-3 left-3 rounded bg-red-600 px-3 py-1 text-sm font-bold text-white">
          LIVE &middot; broadcasting
        </div>
      </div>
      <div className="flex items-center justify-between bg-gray-900 p-3">
        <span className="text-sm text-gray-400">
          {viewers.length} viewer(s) connected
        </span>
        <button
          type="button"
          onClick={handleEndStream}
          disabled={ending}
          className="rounded bg-gray-700 px-4 py-2 text-sm font-bold text-white hover:bg-gray-600 disabled:opacity-50"
        >
          {ending ? "Ending..." : "End Stream"}
        </button>
      </div>
    </div>
  );
}

// Shared between client components and the server-side signaling hub, so
// this file must stay free of "server-only" imports.

export type SignalMessage =
  | { type: "viewer-joined"; from: number; username: string }
  | { type: "viewer-left"; from: number }
  | { type: "offer"; from: number; sdp: RTCSessionDescriptionInit }
  | { type: "answer"; from: number; sdp: RTCSessionDescriptionInit }
  | { type: "ice-candidate"; from: number; candidate: RTCIceCandidateInit };

export const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
];

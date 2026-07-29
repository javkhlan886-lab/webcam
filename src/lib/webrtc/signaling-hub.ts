import "server-only";
import type { SignalMessage } from "@/lib/webrtc/types";

// In-memory pub/sub for WebRTC signaling (SDP offers/answers, ICE candidates).
// Only correct for a single Node process (next dev / next start on one
// instance) — a multi-instance deployment would need a shared broker
// (Redis pub/sub, etc.) instead.

type Subscriber = {
  controller: ReadableStreamDefaultController<Uint8Array>;
  username: string;
};

type Room = Map<number, Subscriber>; // userId -> subscriber

const globalForHub = globalThis as unknown as {
  webrtcRooms?: Map<string, Room>;
};

const rooms = globalForHub.webrtcRooms ?? new Map<string, Room>();
globalForHub.webrtcRooms = rooms;

const encoder = new TextEncoder();

function roomKey(streamId: number) {
  return String(streamId);
}

function encode(message: SignalMessage) {
  return encoder.encode(`data: ${JSON.stringify(message)}\n\n`);
}

export function subscribe(
  streamId: number,
  userId: number,
  username: string,
  controller: ReadableStreamDefaultController<Uint8Array>,
) {
  const key = roomKey(streamId);
  const room = rooms.get(key) ?? new Map<number, Subscriber>();
  room.set(userId, { controller, username });
  rooms.set(key, room);
}

export function unsubscribe(streamId: number, userId: number) {
  const room = rooms.get(roomKey(streamId));
  room?.delete(userId);
  if (room && room.size === 0) rooms.delete(roomKey(streamId));
}

export function listOthers(streamId: number, excludeUserId: number) {
  const room = rooms.get(roomKey(streamId));
  if (!room) return [];
  return [...room.entries()]
    .filter(([userId]) => userId !== excludeUserId)
    .map(([userId, sub]) => ({ userId, username: sub.username }));
}

export function send(
  streamId: number,
  toUserId: number,
  message: SignalMessage,
) {
  const sub = rooms.get(roomKey(streamId))?.get(toUserId);
  if (!sub) return false;
  try {
    sub.controller.enqueue(encode(message));
    return true;
  } catch {
    // Controller closed (client gone) — clean it up.
    unsubscribe(streamId, toUserId);
    return false;
  }
}

export function heartbeat(streamId: number, userId: number) {
  const sub = rooms.get(roomKey(streamId))?.get(userId);
  if (!sub) return;
  try {
    sub.controller.enqueue(encoder.encode(": ping\n\n"));
  } catch {
    unsubscribe(streamId, userId);
  }
}

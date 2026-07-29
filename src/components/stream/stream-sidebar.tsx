"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ChatMessage = { user: string; message: string; id: number };

const TIP_AMOUNTS = [10, 25, 50, 100];

export function StreamSidebar({
  creatorId,
  isLoggedIn,
  currentUsername,
  initialBalance,
}: {
  creatorId: number;
  isLoggedIn: boolean;
  currentUsername: string | null;
  initialBalance: number;
}) {
  const router = useRouter();
  const [balance, setBalance] = useState(initialBalance);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [tipError, setTipError] = useState("");
  const [tipping, setTipping] = useState(false);

  const requireLogin = () => {
    router.push("/login");
  };

  const handleSendMessage = () => {
    if (!isLoggedIn) return requireLogin();
    if (!newMessage.trim()) return;
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), user: currentUsername ?? "you", message: newMessage },
    ]);
    setNewMessage("");
  };

  const handleTip = async (amount: number) => {
    if (!isLoggedIn) return requireLogin();
    setTipError("");
    setTipping(true);
    try {
      const res = await fetch("/api/tokens/tip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creatorId, amount, message: "Great stream!" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Tip failed");
      setBalance(data.balance);
    } catch (err) {
      setTipError(err instanceof Error ? err.message : "Tip failed");
    } finally {
      setTipping(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-gradient-to-r from-pink-600 to-purple-600 p-4 text-white">
        <p className="text-sm text-gray-200">Your Token Balance</p>
        <p className="text-3xl font-bold">{isLoggedIn ? balance : "-"}</p>
        {!isLoggedIn && (
          <p className="mt-1 text-xs text-gray-200">
            Log in to buy tokens and tip.
          </p>
        )}
      </div>

      <div className="rounded-lg bg-gray-800 p-4">
        <p className="mb-3 font-bold text-white">Send a Tip</p>
        {tipError && <p className="mb-2 text-sm text-red-400">{tipError}</p>}
        <div className="grid grid-cols-2 gap-2">
          {TIP_AMOUNTS.map((amount) => (
            <button
              key={amount}
              type="button"
              disabled={tipping}
              onClick={() => handleTip(amount)}
              className="rounded bg-pink-600 py-2 font-bold text-white hover:bg-pink-700 disabled:opacity-50"
            >
              {amount} tokens
            </button>
          ))}
        </div>
      </div>

      <div className="flex h-96 flex-col rounded-lg bg-gray-800 p-4">
        <h3 className="mb-3 font-bold text-white">Live Chat</h3>
        <div className="mb-3 flex-1 space-y-2 overflow-y-auto">
          {messages.map((msg) => (
            <div key={msg.id} className="text-sm text-gray-300">
              <span className="font-bold text-pink-500">{msg.user}:</span>{" "}
              {msg.message}
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Send message..."
            className="flex-1 rounded bg-gray-700 p-2 text-sm text-white placeholder:text-gray-400"
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
          />
          <button
            type="button"
            onClick={handleSendMessage}
            className="rounded bg-pink-600 px-4 text-white hover:bg-pink-700"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

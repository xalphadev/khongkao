"use client";

import { useState } from "react";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PushButton() {
  const [status, setStatus] = useState<"idle" | "loading" | "subscribed" | "error">("idle");

  const subscribe = async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("error");
      return;
    }
    setStatus("loading");
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ) as unknown as BufferSource,
      });
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub),
      });
      setStatus("subscribed");
    } catch {
      setStatus("error");
    }
  };

  if (status === "subscribed") return <p className="text-xs text-green-600">เปิดการแจ้งเตือนแล้ว ✓</p>;

  return (
    <button
      onClick={subscribe}
      disabled={status === "loading"}
      className="text-xs text-gray-500 underline disabled:opacity-50"
    >
      {status === "loading" ? "กำลังเปิด..." : status === "error" ? "เปิดไม่ได้" : "เปิดการแจ้งเตือน"}
    </button>
  );
}

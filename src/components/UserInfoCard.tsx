// src/components/UserInfoCard.tsx
import React, { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { socket } from "../lib/socket";

interface UserInfoCardProps {
  user: {
    id: string;
    name: string;
    username: string;
    email: string;
    role: string;
    avatar?: string;
    isOnline?: boolean;
    createdAt: string;
    bio?: string;
  };
  mode: "tooltip" | "modal";
  position?: { x: number; y: number }; // ใช้กับ tooltip เท่านั้น
  onClose: () => void;
}

export default function UserInfoCard({
  user,
  mode = "tooltip",
  position,
  onClose,
}: UserInfoCardProps) {
  const [isOnline, setIsOnline] = useState<boolean>(!!user.isOnline);

  // ----- socket: real-time status -----
  useEffect(() => {
    const handleStatusChange = ({
      userId,
      isOnline: online,
    }: {
      userId: string;
      isOnline: boolean;
    }) => {
      if (userId === user.id) setIsOnline(online);
    };

    socket.on("userStatusChanged", handleStatusChange);
    return () => {
      socket.off("userStatusChanged", handleStatusChange);
    };
  }, [user.id]);

  // ----- lock scroll & ESC to close (modal only) -----
  useEffect(() => {
    if (mode !== "modal") return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [mode, onClose]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const RoleBadge = useMemo(() => {
    if (!user.role || user.role === "user") return null;

    const colors: Record<string, string> = {
      admin:
        "bg-gradient-to-r from-amber-500/30 to-orange-600/30 text-amber-300 border-amber-500/40 shadow-lg shadow-amber-500/10",
      moderator:
        "bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-orange-300 border-orange-500/40",
      premium:
        "bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-amber-300 border-amber-500/30",
    };

    const cls =
      colors[user.role] ||
      "bg-slate-500/20 text-slate-300 border-slate-500/30";

    return (
      <span
        className={`px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-lg border ${cls}`}
      >
        {user.role}
      </span>
    );
  }, [user.role]);

  const cardContent = (
    <div className="relative">
      {/* Avatar + name + role */}
      <div className="flex flex-col items-center text-center mb-10">
        <div className="relative mb-6">
          <div className="w-40 h-40 rounded-full bg-gradient-to-br from-amber-500/30 to-orange-600/30 flex items-center justify-center text-6xl font-bold text-white border-4 border-amber-500/40 overflow-hidden ring-4 ring-amber-400/30 shadow-2xl shadow-amber-500/30">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name || user.username}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-amber-300">
                {(user.name || user.username || user.email)?.[0]?.toUpperCase()}
              </span>
            )}
          </div>

          {/* Online Badge */}
          {isOnline && (
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white text-sm font-bold rounded-full shadow-xl shadow-green-500/50 border-2 border-slate-900">
              <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse" />
              Online
            </div>
          )}
        </div>

        <h2 className="text-4xl font-bold text-white mb-3">
          {user.name || user.username || "Unknown User"}
        </h2>

        {!!RoleBadge && <div className="mb-2">{RoleBadge}</div>}

        <p className="text-xs text-gray-400">
          Joined {formatDate(user.createdAt)}
        </p>
        <p className="text-xs text-gray-400">{user.email}</p>
      </div>

      {/* Bio */}
      <div className="bg-gradient-to-br from-slate-800/70 to-slate-800/50 backdrop-blur-sm p-8 rounded-2xl border-2 border-amber-500/30 shadow-2xl shadow-amber-500/10">
        <div className="flex items-center gap-3 mb-5">
          <svg
            className="w-7 h-7 text-amber-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M4 6h16M4 12h16M4 18h7"
            />
          </svg>
        <h3 className="text-xl font-bold text-amber-400 uppercase tracking-wider">
            Bio
          </h3>
        </div>

        {user.bio?.trim() ? (
          <p className="text-slate-200 text-lg leading-relaxed whitespace-pre-wrap">
            {user.bio}
          </p>
        ) : (
          <p className="text-slate-500 text-lg italic text-center py-8">
            No bio yet
          </p>
        )}
      </div>
    </div>
  );

  // ================== TOOLTIP MODE ==================
  if (mode === "tooltip" && position) {
    return (
      <div
        className="fixed z-40 animate-in fade-in slide-in-from-bottom-2 duration-200"
        style={{
          left: position.x, // px โดยอัตโนมัติใน React
          top: position.y,
          transform: "translate(-50%, 10px)",
        }}
      >
        <div className="pointer-events-auto bg-slate-900/95 backdrop-blur-xl border border-amber-500/20 rounded-xl shadow-2xl shadow-amber-500/5 p-4 min-w-[280px] max-w-[320px]">
          {cardContent}
        </div>
      </div>
    );
  }

  // ================== MODAL MODE (CENTER) ==================
  const modalNode = (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 backdrop-blur-xl border-2 border-amber-500/40 rounded-3xl shadow-2xl shadow-amber-500/20 p-10 w-full max-w-2xl animate-in zoom-in-95 duration-150">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-3 rounded-xl bg-slate-800/80 hover:bg-amber-500/20 transition-all text-slate-400 hover:text-amber-300 ring-2 ring-slate-700 hover:ring-amber-500/50 duration-150 group"
          aria-label="Close"
        >
          <svg
            className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {cardContent}
      </div>
    </div>
  );

  // ใช้ Portal เพื่อไม่ให้ modal โดน parent (sidebar/chat) ที่มี overflow/stacking ตัดทอน
  return createPortal(modalNode, document.body);
}

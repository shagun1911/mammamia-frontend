"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { user, logout } = useAuth();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSignOut = async () => {
    await logout();
  };

  // Get user initials for avatar
  const getInitials = (name?: string) => {
    if (!name) return "U";
    const names = name.split(" ");
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium hover:brightness-110 transition-all"
      >
        {getInitials(user?.name)}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-popover border border-border rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
          <div className="p-3 border-b border-border">
            <p className="text-sm font-medium text-popover-foreground">{user?.name || "User"}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{user?.email || ""}</p>
          </div>

          <div className="py-1">
            <Link
              href="/profile"
              className="flex items-center gap-3 h-10 px-4 text-sm text-popover-foreground hover:bg-accent transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <User className="w-4 h-4" />
              <span>Profile</span>
            </Link>
          </div>

          <div className="border-t border-border py-1">
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 h-10 px-4 text-sm text-red-500 hover:bg-accent transition-colors w-full"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/shared/store/app.store";
import { useAuthStore } from "@/shared/store/auth.store";
import { useUnreadCount } from "@/modules/notifications/hooks";
import NotificationList from "@/modules/notifications/components/NotificationList";

export default function Navbar() {
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: unreadCount } = useUnreadCount();

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="fixed left-0 top-0 z-10 flex h-16 w-full items-center justify-between bg-gray-800 px-6 text-white shadow-md">
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="rounded p-1 hover:bg-gray-700"
          aria-label="Toggle sidebar"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
        <span className="text-lg font-bold">Exam Duty</span>
      </div>

      <div className="flex items-center gap-4">
        <div ref={dropdownRef} className="relative">
          <button
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="relative rounded p-1 hover:bg-gray-700"
            aria-label="Notifications"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            {!!unreadCount && unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2">
              <NotificationList />
            </div>
          )}
        </div>

        {user && (
          <span className="text-sm text-gray-300">{user.name}</span>
        )}
        <button
          onClick={handleLogout}
          className="rounded px-3 py-1 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
        >
          Logout
        </button>
      </div>
    </header>
  );
}

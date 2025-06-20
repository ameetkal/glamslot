"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  CalendarIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";

const navItems = [
  {
    name: "Requests",
    href: "/dashboard/requests",
    icon: HomeIcon,
  },
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: ClipboardDocumentListIcon,
  },
  {
    name: "Availability",
    href: "/dashboard/availability",
    icon: CalendarIcon,
  },
  {
    name: "Settings",
    href: "/dashboard/settings",
    icon: Cog6ToothIcon,
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 block border-t border-gray-200 bg-white shadow-t sm:hidden">
      <div className="flex justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 py-2 text-xs transition-colors duration-150 ${
                isActive ? "text-gray-900" : "text-gray-500 hover:text-accent-500"
              }`}
            >
              <item.icon className="h-6 w-6 mb-1" aria-hidden="true" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
} 
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Calendar,
  Building2,
  Stethoscope,
  UserPlus,
  LogOut,
  UserCog,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Pacientes", href: "/dashboard/patients", icon: Users },
  { name: "Turnos", href: "/dashboard/appointments", icon: Calendar },
  { name: "Calendario", href: "/dashboard/calendar", icon: Calendar },
  { name: "Consultorios", href: "/dashboard/clinics", icon: Building2 },
  { name: "Tratamientos", href: "/dashboard/treatments", icon: Stethoscope },
  { name: "Leads", href: "/dashboard/leads", icon: UserPlus },
  { name: "Usuarios", href: "/dashboard/users", icon: UserCog },
];

export function Sidebar({ userRole }: { userRole: string }) {
  const pathname = usePathname();

  return (
    <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 md:pt-16">
      <div className="flex-1 flex flex-col min-h-0 border-r bg-card shadow-sm">
        <div className="flex-1 flex flex-col pt-6 pb-4 overflow-y-auto">
          <nav className="flex-1 px-3 space-y-1">
            {navigation.map((item) => {
              const isActive =
                pathname === item.href ||
                pathname?.startsWith(item.href + "/");
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:shadow-sm"
                  )}
                >
                  <item.icon
                    className={cn(
                      "mr-3 flex-shrink-0 h-5 w-5 transition-transform",
                      isActive
                        ? "text-primary-foreground"
                        : "text-muted-foreground group-hover:text-accent-foreground group-hover:scale-110"
                    )}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex-shrink-0 flex border-t border-border p-4">
          <Button
            variant="ghost"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full justify-start group"
          >
            <LogOut className="mr-3 h-5 w-5 text-muted-foreground group-hover:text-destructive transition-colors" />
            <span className="text-sm font-medium text-muted-foreground group-hover:text-destructive transition-colors">
              Cerrar sesión
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}

import { ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { MobileMenu } from "./basic-menu";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <MobileMenu />
      
      <div className="lg:ml-64 min-h-screen pt-4 pb-12 lg:pt-0 lg:pb-0 mt-16 lg:mt-0">
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

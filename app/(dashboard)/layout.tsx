// import Sidebar from "@/components/dashboard/sidebar";
// import TopNavbar from "@/components/dashboard/top-navbar";

// export default function AdminLayout({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   return (
//     <div className="min-h-screen bg-[#faf8ff]">
//       <Sidebar />

//       <div className="ml-64">
//         <TopNavbar />

//         <main className="pt-20 px-8 pb-8">
//           {children}
//         </main>
//       </div>
//     </div>
//   );
// }


"use client";

import { useState } from "react";

import Sidebar from "@/components/dashboard/sidebar";
import TopNavbar from "@/components/dashboard/top-navbar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#faf8ff]">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="min-h-dvh lg:ml-64">
        <TopNavbar
          onMenuClick={() => setSidebarOpen((prev) => !prev)}
        />

        <main className="min-h-dvh px-4 pt-20 pb-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
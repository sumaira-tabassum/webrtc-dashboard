import Sidebar from "@/components/admin/sidebar";
import TopNavbar from "@/components/admin/top-navbar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#faf8ff]">
      <Sidebar />

      <div className="ml-64">
        <TopNavbar />

        <main className="pt-20 px-8 pb-8">
          {children}
        </main>
      </div>
    </div>
  );
}
// import Sidebar from "@/components/admin/sidebar";
// import TopNavbar from "@/components/admin/top-navbar";

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
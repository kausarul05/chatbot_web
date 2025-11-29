import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Image from "next/image";
// import profile from "@/../public/images/profile.jpg"
// import { ChevronsLeft } from "lucide-react";
// import AdminAuthWrapper from "./Components/AdminAuthWrapper/AdminAuthWrapper";
// import Sidebar from "./Components/Sidebar/Sidebar";
import Link from "next/link";
import Sidebar from "./components/sidebar/Sidebar";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Dashboard",
    description: "Dashboard management panel",
};

export default function DashboardLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        // <AdminAuthWrapper>
            <div className="flex">
                <div>
                    <Sidebar />
                </div>
                <div className="w-full pl-[385px] bg-[#0A2131]">
                    <div className="flex justify-between bg-[#0D314B] p-6">
                        <h2 className="font-semibold text-[20px] flex items-center gap-3 cursor-pointer text-white">
                            {/* <ChevronsLeft size={28} className="font-bold" /> Overview */}
                        </h2>
                        <Link href="/admin/settings">
                            {/* <Image
                                src={profile}
                                alt="abc"
                                width={800}
                                height={400}
                                className="w-10 h-10 object-fill rounded-full cursor-pointer"
                            /> */}
                        </Link>
                    </div>
                    {children}
                </div>
            </div>
        // </AdminAuthWrapper>
    );
}
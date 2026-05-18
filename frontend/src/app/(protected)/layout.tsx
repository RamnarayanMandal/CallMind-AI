'use client';
import ProtectedLayout from "@/components/common/ProtectedLayout";


export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedLayout>
      {children}
    </ProtectedLayout>
  );
}

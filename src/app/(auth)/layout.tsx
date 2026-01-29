import { Metadata } from "next";

export const metadata: Metadata = {
  title: "로그인",
  description: "UFLUX 계정에 로그인하세요",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}


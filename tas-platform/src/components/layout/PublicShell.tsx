"use client";

import { usePathname } from "next/navigation";
import TopBar from "./TopBar";
import Header from "./Header";
import MarketTicker from "./MarketTicker";
import Footer from "./Footer";
import FloatingCTA from "@/components/ui/FloatingCTA";

export default function PublicShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isEmployeePortal = pathname.startsWith("/employee");
  const isLoginPage = pathname === "/login";

  // Don't render public chrome for employee portal or login page
  if (isEmployeePortal || isLoginPage) {
    return <>{children}</>;
  }

  return (
    <>
      <TopBar />
      <Header />
      <MarketTicker />
      {children}
      <Footer />
      <FloatingCTA />
    </>
  );
}

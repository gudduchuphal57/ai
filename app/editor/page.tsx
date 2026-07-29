"use client";

import { useState } from "react";
import Header from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import MainHero from "./components/MainHero";

export default function Page() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  

  return (
    <main className="min-h-screen bg-white text-black">
      <Header onMenuClick={() => setMobileOpen(true)} />

      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      <MainHero collapsed={collapsed} />
    </main>
  );
}

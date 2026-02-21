import React from "react";
import { Outlet } from "react-router-dom";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

export const Layout = () => {
  return (
    <div className="flex flex-col min-h-screen bg-black">
      <Navbar />
      <main className="grow pt-16"><Outlet /></main>
      <Footer />
    </div>
  );
};

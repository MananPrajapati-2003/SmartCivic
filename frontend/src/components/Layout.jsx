import React from "react";
import { Outlet } from "react-router-dom";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

export const Layout = () => {
  return (
    <div className="flex flex-col min-h-screen bg-black transition-colors duration-200">
      <Navbar />
      <main className="grow pt-16"><Outlet /></main>
      <Footer />
    </div>
  );
};

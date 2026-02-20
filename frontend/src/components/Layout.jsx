import React from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

export const Layout = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen bg-black">
      <Navbar />
      <main className="grow pt-16">{children}</main>
      <Footer />
    </div>
  );
};

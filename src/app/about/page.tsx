"use client";
import Header from "@/components/Header";
import UnderDevelopmentSection from "@/components/UnderDevelopmentSection";
import Footer from "@/components/Footer";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-white selection:text-black">
      <Header />
      <main className="w-full">
        <UnderDevelopmentSection id="about" line1="NOSOTROS" line2="EN" line3="DESARROLLO" />
        <Footer />
      </main>
    </div>
  );
}

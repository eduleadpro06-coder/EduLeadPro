import React from "react";

export default function HeroSection() {
  return (
    <section className="relative min-h-[80vh] flex flex-col items-center justify-center bg-gradient-to-b from-black via-[#2d0036] to-[#ff5cf7] pb-24">
      {/* Overlay for subtle darkening */}
      <div className="absolute inset-0 bg-black/60 z-0" />
      <div className="relative z-10 flex flex-col items-center text-center px-4">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 leading-tight">
          One platform – total control <br /> of your financial flows
        </h1>
        <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-2xl">
          Centralizing all your monthly expenses in one place to control your cash flow and excel in financial planning.
        </p>
        <div className="flex gap-4 mb-12">
          <button className="bg-white text-black font-semibold px-6 py-3 rounded-lg shadow hover:bg-gray-200 transition">
            Get started
          </button>
          <button className="border border-white text-white font-semibold px-6 py-3 rounded-lg hover:bg-white/10 transition">
            Learn more
          </button>
        </div>
        {/* Optional: Dashboard mockup image */}
        <img
          src="/assets/Dashboard.png"
          alt="Dashboard mockup"
          className="rounded-2xl shadow-2xl w-full max-w-3xl mx-auto"
        />
      </div>
    </section>
  );
} 
import React from "react";
import { Button } from "./button";
import { Check } from "lucide-react";

export default function AISolutionCard({
  title,
  features,
  image,
}: {
  title: string;
  features: string[];
  image: string;
}) {
  return (
    <div className="rounded-3xl bg-white dark:bg-[#0e0f12] shadow-2xl p-12 text-gray-900 dark:text-white flex flex-col md:flex-row items-center gap-16 min-h-[500px] border border-gray-200 dark:border-slate-800">
      <div className="md:w-1/2">
        <h2 className="text-5xl font-bold tracking-tighter mb-8">{title}</h2>
        <ul className="space-y-4 text-gray-700 dark:text-slate-200 mb-10">
          {features.map((feature, i) => (
            <li key={i} className="flex items-center gap-4">
              <Check className="w-6 h-6 text-purple-400 flex-shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        <Button variant="outline" className="text-gray-900 dark:text-white border-gray-300 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white text-base py-3 px-6">
          Find out more →
        </Button>
      </div>
      <div className="md:w-1/2 flex items-center justify-center bg-gradient-to-br from-purple-600 via-fuchsia-500 to-orange-400 rounded-2xl p-4">
        <img src={image} alt={title} className="rounded-lg shadow-lg max-h-[360px] w-full object-contain" />
      </div>
    </div>
  );
} 
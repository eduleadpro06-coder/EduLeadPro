import React from "react";
import DonutChart from "../components/dashboard/DonutChart";
import DivisionCardList from "../components/dashboard/DivisionCardList";
import HighlightCard from "../components/dashboard/HighlightCard";
import LineChart from "../components/dashboard/LineChart";

const inOutData = [
  { label: "Inpatients", value: 60 },
  { label: "Outpatients", value: 40 },
];
const genderData = [
  { label: "Female", value: 55 },
  { label: "Male", value: 45 },
];
const divisionData = [
  { label: "Cardiology", count: 1200, color: "#7C3AED" },
  { label: "Neurology", count: 980, color: "#14B8A6" },
  { label: "Surgery", count: 1060, color: "#F59E42" },
];
const miniGraphData = [
  { x: "1", y: 100 },
  { x: "2", y: 120 },
  { x: "3", y: 90 },
  { x: "4", y: 140 },
  { x: "5", y: 110 },
  { x: "6", y: 160 },
  { x: "7", y: 130 },
];
const timeAdmittedData = [
  { x: "7 AM", y: 10 },
  { x: "8 AM", y: 18 },
  { x: "9 AM", y: 22 },
  { x: "10 AM", y: 30 },
  { x: "11 AM", y: 25 },
  { x: "12 PM", y: 20 },
];

export default function HealthDashboard() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-[1200px] h-[900px] grid grid-cols-2 grid-rows-2 gap-8 p-8 rounded-3xl shadow-lg bg-white">
        <div className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center">
          <DonutChart
            title="Inpatients vs Outpatients"
            data={inOutData}
            colors={["#7C3AED", "#F59E42"]}
          />
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center">
          <DonutChart
            title="Patients by Gender"
            data={genderData}
            colors={["#14B8A6", "#F59E42"]}
          />
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <DivisionCardList divisions={divisionData} />
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 flex flex-col justify-between">
          <HighlightCard
            title="Patients this Month"
            value={3240}
            miniGraphData={miniGraphData}
            accentColor="#7C3AED"
          />
        </div>
        {/* Optional: Line chart at the bottom, spanning both columns */}
        <div className="col-span-2 bg-white rounded-xl shadow-md p-6 mt-4">
          <LineChart
            data={timeAdmittedData}
            color="#7C3AED"
            height={120}
          />
          <div className="text-center text-sm text-gray-500 mt-2">Time Admitted Today (7 AM - 12 PM)</div>
        </div>
      </div>
    </div>
  );
} 
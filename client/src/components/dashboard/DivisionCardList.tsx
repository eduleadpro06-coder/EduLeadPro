import React from "react";
import { Card } from "@/components/ui/card";
import { Heart, Brain, Syringe } from "lucide-react";

const ICONS: Record<string, React.ReactNode> = {
  Cardiology: <Heart className="w-6 h-6" />,
  Neurology: <Brain className="w-6 h-6" />,
  Surgery: <Syringe className="w-6 h-6" />,
};

interface Division {
  label: string;
  count: number;
  color: string;
}

interface DivisionCardListProps {
  divisions: Division[];
}

const DivisionCardList: React.FC<DivisionCardListProps> = ({ divisions }) => (
  <div>
    <h3 className="mb-4 text-lg font-semibold text-gray-800">Patients by Division</h3>
    <div className="flex gap-4">
      {divisions.map((div) => (
        <Card key={div.label} className="flex flex-col items-center p-4 min-w-[110px] shadow-sm">
          <div className="mb-2" style={{ color: div.color }}>
            {ICONS[div.label]}
          </div>
          <div className="text-md font-medium text-gray-700">{div.label}</div>
          <div className="text-xl font-bold" style={{ color: div.color }}>{div.count}</div>
        </Card>
      ))}
    </div>
  </div>
);

export default DivisionCardList; 
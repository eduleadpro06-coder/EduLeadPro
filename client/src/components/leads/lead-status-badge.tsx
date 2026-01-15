import { Badge } from "@/components/ui/badge";

interface LeadStatusBadgeProps {
  status: string;
}

export default function LeadStatusBadge({ status }: LeadStatusBadgeProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "new": return "bg-blue-100 text-blue-800";
      case "contacted": return "bg-purple-100 text-purple-800";
      case "interested": return "bg-yellow-100 text-yellow-800";
      case "pre_enrolled": return "bg-indigo-100 text-indigo-800";
      case "future_intake": return "bg-sky-100 text-sky-800";
      case "enrolled": return "bg-green-100 text-green-800";
      case "dropped": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Badge variant="status" className={getStatusColor(status)}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

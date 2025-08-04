import { Badge } from "@/components/ui/badge";

interface LeadStatusBadgeProps {
  status: string;
}

export default function LeadStatusBadge({ status }: LeadStatusBadgeProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "new": return "bg-blue-1000 text-blue-800";
      case "contacted": return "bg-purple-1000 text-purple-500";
      case "interested": return "bg-yellow-1000 text-yellow-800";
      case "enrolled": return "bg-green-1000 text-green-800";
      case "dropped": return "bg-red-1000 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Badge variant="status" className={getStatusColor(status)}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

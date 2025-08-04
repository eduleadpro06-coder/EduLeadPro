import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Calendar } from "lucide-react";

export function EnrollmentChart() {
  const { data: monthlyEnrollments = [] } = useQuery({
    queryKey: ['/api/analytics/monthly-enrollments'],
  });

  const maxEnrollments = Math.max(...monthlyEnrollments.map(m => m.enrollments), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Calendar className="w-5 h-5 mr-2" />
          Monthly Enrollment Trend
        </CardTitle>
      </CardHeader>
      <CardContent>
        {monthlyEnrollments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No enrollment data available yet</p>
          </div>
        ) : (
          <div className="relative h-64 bg-gradient-to-t from-primary/10 to-transparent rounded-lg flex items-end justify-between p-4">
            {monthlyEnrollments.map((data, index) => {
              const height = (data.enrollments / maxEnrollments) * 200;
              const isProjected = index >= monthlyEnrollments.length - 1;
              
              return (
                <div key={data.month} className="flex flex-col items-center">
                  <div 
                    className={`w-8 rounded-t transition-all duration-300 ${
                      isProjected ? 'bg-primary/60' : 'bg-primary'
                    }`}
                    style={{ height: `${height}px` }}
                  ></div>
                  <span className="text-xs text-gray-600 mt-2">{data.month}</span>
                  <span className="text-xs font-medium text-gray-900">
                    {data.enrollments}{isProjected ? '*' : ''}
                  </span>
                </div>
              );
            })}
          </div>
        )}
        <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
          <span>*Projected enrollment</span>
          <span className="text-green-600 font-medium">Based on current trends</span>
        </div>
      </CardContent>
    </Card>
  );
}

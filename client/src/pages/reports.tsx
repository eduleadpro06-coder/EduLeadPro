import { useState } from "react";
import { useQueryState } from "@/hooks/use-query-state";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Filter, Download, FileText } from "lucide-react";

export default function Reports() {
  const [paymentProgram, setPaymentProgram] = useState<string>("all");
  const [paymentStatus, setPaymentStatus] = useState<string>("all");

  const paymentDueUrl = `/api/reports/payment-due?${new URLSearchParams({
    ...(paymentProgram !== "all" && { program: paymentProgram }),
    ...(paymentStatus !== "all" && { status: paymentStatus })
  })}`;

  // Fetch all data for filters (unfiltered)
  const { data: allPaymentData } = useQuery<any[]>({
    queryKey: ['/api/reports/payment-due']
  });

  // Extract unique programs from all data
  const uniquePrograms = Array.from(new Set(allPaymentData?.map((item: any) => item.program).filter(Boolean))).sort();

  const { data: paymentDueData, isLoading } = useQuery<any[]>({
    queryKey: [paymentDueUrl]
  });

  const [activeTab, setActiveTab] = useQueryState("tab", "payment-due");

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        className="py-4"
        title="Reports"
        subtitle="View and export financial and operational reports"
      />

      <div className="px-6 pt-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b">
          <div className="flex gap-2 -mb-px w-full">
            <Button
              variant={activeTab === "payment-due" ? "default" : "ghost"}
              onClick={() => setActiveTab("payment-due")}
              className="rounded-b-none flex-1"
            >
              <FileText className="h-4 w-4 mr-2" />
              Payment Due
            </Button>
            {/* Add more report tabs here in the future */}
          </div>
        </div>
      </div>

      <main className="px-6 py-6 space-y-6">

        {activeTab === "payment-due" && (
          <div className="space-y-6 animate-in fade-in-50 duration-300">
            {/* Header for specific report if needed, or keeping it clean */}
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Payment Due Report</h2>
                <p className="text-gray-600">Track student fee payments and dues</p>
              </div>
            </div>

            {/* Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Filter size={16} className="text-gray-500" />
                    <label className="text-sm font-medium text-gray-700">Program:</label>
                    <Select value={paymentProgram} onValueChange={setPaymentProgram}>
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Programs</SelectItem>
                        {uniquePrograms.map((program: any) => (
                          <SelectItem key={program} value={program}>{program}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">Status:</label>
                    <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="not_paid">Not Paid</SelectItem>
                        <SelectItem value="partially_paid">Partially Paid</SelectItem>
                        <SelectItem value="fully_paid">Fully Paid</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const data = paymentDueData || [];
                      const csv = [
                        ["Student Name", "Student Phone", "Father Name", "Parent Phone", "Program", "Invoice No", "Admission Date", "Tuition Fee", "Tuition Paid", "Add. Paid", "Discount", "Collected (Reg)", "Collected (EMI)", "Collected (Other)", "Total Collected", "Payment Modes", "Last Payment Date", "Next Due Date", "Total Due", "Status"],
                        ...data.map((row: any) => [
                          row.studentName,
                          row.studentPhone,
                          row.fatherName,
                          row.parentPhone,
                          row.program,
                          row.invoiceNumber,
                          new Date(row.admissionDate).toLocaleDateString(),
                          row.invoiceAmount,
                          row.collectedTuition || 0,
                          row.additionalPaid || 0,
                          row.totalDiscount,
                          row.collectedRegistration,
                          row.collectedEmi,
                          row.collectedOther,
                          row.totalCollected,
                          row.paymentModes,
                          row.lastPaymentDate ? new Date(row.lastPaymentDate).toLocaleDateString() : 'N/A',
                          row.nextDueDate ? new Date(row.nextDueDate).toLocaleDateString() : 'N/A',
                          row.totalDue,
                          row.paymentStatus
                        ])
                      ].map(row => row.join(",")).join("\n");

                      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `payment-due-report-${new Date().toISOString().split('T')[0]}.csv`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                  >
                    <Download size={16} className="mr-2" />
                    Export CSV
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Payment Due Table */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Due Details</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500">Loading payment data...</p>
                  </div>
                ) : paymentDueData && paymentDueData.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-gray-50/50 text-xs text-gray-500">
                          <th className="px-2 py-2 text-left font-medium w-[160px]">Student</th>
                          <th className="px-2 py-2 text-left font-medium w-[160px]">Father / Phone</th>
                          <th className="px-2 py-2 text-left font-medium">Program</th>
                          <th className="px-2 py-2 text-right font-medium whitespace-nowrap">Tuition Fee</th>
                          <th className="px-2 py-2 text-right font-medium whitespace-nowrap">Tuition Paid</th>
                          <th className="px-2 py-2 text-right font-medium whitespace-nowrap">Add. Paid</th>
                          <th className="px-2 py-2 text-left font-medium pl-4 w-[120px]">Dates</th>
                          <th className="px-2 py-2 text-right font-medium whitespace-nowrap">Total Due</th>
                          <th className="px-2 py-2 text-center font-medium w-[100px]">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paymentDueData.map((row: any) => (
                          <tr key={row.id} className="border-b hover:bg-gray-50/50 transition-colors text-sm">
                            <td className="px-2 py-2 align-top">
                              <div className="font-medium text-gray-900">{row.studentName}</div>
                            </td>
                            <td className="px-2 py-2 align-top">
                              <div className="text-gray-900">{row.fatherName}</div>
                              <div className="text-xs text-gray-500 font-mono mt-0.5">{row.parentPhone || '-'}</div>
                            </td>
                            <td className="px-2 py-2 align-top">
                              <div className="text-gray-700">{row.program}</div>
                              <div className="text-xs text-gray-400 font-mono mt-0.5">{row.invoiceNumber}</div>
                            </td>
                            <td className="px-2 py-2 text-right align-top whitespace-nowrap">
                              <div className="font-medium">₹{row.invoiceAmount.toLocaleString()}</div>
                              {row.totalDiscount > 0 && (
                                <div className="text-xs text-green-600 mt-0.5">Disc: ₹{row.totalDiscount.toLocaleString()}</div>
                              )}
                            </td>
                            <td className="px-2 py-2 text-right align-top whitespace-nowrap">
                              <div className="font-medium text-gray-700">₹{(row.collectedTuition || 0).toLocaleString()}</div>
                            </td>
                            <td className="px-2 py-2 text-right align-top whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                <div className="font-medium text-gray-700">₹{(row.additionalPaid || 0).toLocaleString()}</div>
                                {row.additionalPaidReasons && (
                                  <div className="text-[10px] text-gray-500 max-w-[120px] truncate" title={row.additionalPaidReasons}>
                                    ({row.additionalPaidReasons})
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-2 py-2 text-sm align-top pl-4">
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2 text-xs">
                                  <span className="text-gray-400 w-6">Last</span>
                                  <span className="text-gray-700 font-medium whitespace-nowrap">
                                    {row.lastPaymentDate ? new Date(row.lastPaymentDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' }) : '-'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                  <span className="text-gray-400 w-6">Next</span>
                                  <span className={`font-medium whitespace-nowrap ${row.nextDueDate && new Date(row.nextDueDate) < new Date() && row.totalDue > 0
                                    ? 'text-red-600 bg-red-50 px-1 rounded'
                                    : 'text-gray-700'
                                    }`}>
                                    {row.nextDueDate ? new Date(row.nextDueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' }) : '-'}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="px-2 py-2 text-right font-bold text-orange-600 align-top whitespace-nowrap">
                              ₹{row.totalDue.toLocaleString()}
                            </td>
                            <td className="px-2 py-2 text-center align-top">
                              <Badge variant="outline" className={`px-2 py-0.5 text-[10px] whitespace-nowrap ${row.paymentStatus === "fully_paid" ? "bg-green-50 text-green-700 border-green-200" :
                                row.paymentStatus === "overdue" ? "bg-red-50 text-red-700 border-red-200" :
                                  row.paymentStatus === "partially_paid" ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                                    "bg-gray-50 text-gray-700 border-gray-200"
                                }`}>
                                {row.paymentStatus.replace("_", " ").toUpperCase()}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-white border-t-2 border-gray-100 font-semibold text-sm">
                          <td colSpan={3} className="px-2 py-2 text-right text-gray-600">TOTAL:</td>
                          <td className="px-2 py-2 text-right">₹{paymentDueData.reduce((sum: number, r: any) => sum + r.invoiceAmount, 0).toLocaleString()}</td>
                          <td className="px-2 py-2 text-right text-green-600">₹{paymentDueData.reduce((sum: number, r: any) => sum + (r.collectedTuition || 0), 0).toLocaleString()}</td>
                          <td className="px-2 py-2 text-right text-blue-600">₹{paymentDueData.reduce((sum: number, r: any) => sum + (r.additionalPaid || 0), 0).toLocaleString()}</td>
                          <td></td>
                          <td className="px-2 py-2 text-right text-orange-600">₹{paymentDueData.reduce((sum: number, r: any) => sum + r.totalDue, 0).toLocaleString()}</td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <FileText className="mx-auto mb-4 text-gray-400" size={48} />
                    <p>No payment data available for the selected filters</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

      </main>
    </div>
  );
}

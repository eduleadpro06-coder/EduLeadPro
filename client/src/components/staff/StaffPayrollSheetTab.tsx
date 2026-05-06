// @ts-nocheck
import { useState, useMemo, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Download, Save, Search, Printer, FileSpreadsheet } from "lucide-react";
import { apiRequest } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────
interface Staff {
  id: number;
  name: string;
  employeeId: string;
  role: string;
  department: string;
  salary: number;
  dateOfJoining: string;
  phone?: string;
  email?: string;
  isActive?: boolean;
}

interface PayrollSheetRow {
  staffId: number;
  name: string;
  role: string;
  totalNoDays: number;
  absent: number | "";
  totalDaysWorked: number;
  salary: number;
  netSalary: number;
  deposit: number | "";
  deductions: number | "";
  reimbursment: number | "";
  amountPaid: number;
  remarks: string;
}

const ROLE_PRIORITY: Record<string, number> = {
  "Director": 1,
  "Principal": 2,
  "Counselor": 3,
  "Teacher": 4,
  "Care Giver": 5,
  "Security Guard": 6
};

const getRolePriority = (role?: string) => {
  if (!role) return 100;
  return ROLE_PRIORITY[role] || 50;
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function StaffPayrollSheetTab({ month, year }: { month: number; year: number }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Use props for Month / Year
  const selectedMonth = month;
  const selectedYear = year;
  const [searchQuery, setSearchQuery] = useState("");


  // Editable sheet data keyed by staffId
  const [sheetData, setSheetData] = useState<Record<number, Partial<PayrollSheetRow>>>({});

  // ── Data fetching ──────────────────────────────────────────────────────────
  const { data: staff = [] } = useQuery<Staff[]>({
    queryKey: ["/api/staff"],
  });

  const { data: payrollOverview = [] } = useQuery<any[]>({
    queryKey: ["/api/payroll/overview", selectedMonth, selectedYear],
    queryFn: async () => {
      const res = await fetch(`/api/payroll/overview?month=${selectedMonth}&year=${selectedYear}`);
      return res.json();
    },
  });

  // Only active staff
  const activeStaff = useMemo(
    () => (staff as Staff[]).filter((s) => s.isActive !== false),
    [staff],
  );

  // Search filter
  const filteredStaff = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [...activeStaff].sort((a, b) => getRolePriority(a.role) - getRolePriority(b.role));
    return activeStaff.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.employeeId && s.employeeId.toLowerCase().includes(q)),
    ).sort((a, b) => getRolePriority(a.role) - getRolePriority(b.role));
  }, [activeStaff, searchQuery]);

  // ── Seed sheet data from payroll overview when it loads ─────────────────────
  useEffect(() => {
    if (!payrollOverview || payrollOverview.length === 0) return;
    setSheetData((prev) => {
      const next = { ...prev };
      payrollOverview.forEach((po: any) => {
        // Only seed if not already edited by user
        if (!next[po.id] && po.payroll && po.payrollStatus === "processed") {
          const totalNoDays = 30;
          const attendedDays = po.payroll.attendedDays ?? 30;
          const absent = totalNoDays - attendedDays;
          next[po.id] = {
            absent,
            deposit: 0,
            deductions: po.payroll.deductions ?? 0,
            reimbursment: 0,
            remarks: "",
          };
        }
      });
      return next;
    });
  }, [payrollOverview]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const TOTAL_DAYS = 30;

  const getRowData = useCallback(
    (member: Staff): PayrollSheetRow => {
      const edit = sheetData[member.id] || {};
      const absent = edit.absent !== undefined && edit.absent !== "" ? Number(edit.absent) : 0;
      const totalDaysWorked = TOTAL_DAYS - absent;
      const salary = Number(member.salary);
      const netSalary = salary * (totalDaysWorked / TOTAL_DAYS);
      const deposit = edit.deposit !== undefined && edit.deposit !== "" ? Number(edit.deposit) : 0;
      const deductions = edit.deductions !== undefined && edit.deductions !== "" ? Number(edit.deductions) : 0;
      const reimbursment = edit.reimbursment !== undefined && edit.reimbursment !== "" ? Number(edit.reimbursment) : 0;
      const amountPaid = Math.round(netSalary + reimbursment - deductions - deposit);
      const remarks = edit.remarks ?? "";

      return {
        staffId: member.id,
        name: member.name,
        role: member.role,
        totalNoDays: TOTAL_DAYS,
        absent: edit.absent ?? 0,
        totalDaysWorked,
        salary,
        netSalary,
        deposit: edit.deposit ?? 0,
        deductions: edit.deductions ?? 0,
        reimbursment: edit.reimbursment ?? 0,
        amountPaid,
        remarks,
      };
    },
    [sheetData],
  );

  const handleCellChange = (
    staffId: number,
    field: "absent" | "deposit" | "deductions" | "reimbursment" | "remarks",
    value: string,
  ) => {
    setSheetData((prev) => ({
      ...prev,
      [staffId]: {
        ...prev[staffId],
        [field]: field === "remarks" ? value : value === "" ? "" : Number(value),
      },
    }));
  };

  // ── Generate payroll mutation (reuses existing endpoint) ───────────────────
  const generatePayrollMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/payroll/generate", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payroll"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/payroll/overview", selectedMonth, selectedYear],
      });
    },
  });

  const handleSaveAll = () => {
    let count = 0;
    filteredStaff.forEach((member) => {
      const row = getRowData(member);
      const payrollData = {
        staffId: member.id,
        month: selectedMonth,
        year: selectedYear,
        basicSalary: row.netSalary,
        allowances: row.reimbursment,
        deductions: Number(row.deductions) + Number(row.deposit),
        overtime: 0,
        netSalary: row.amountPaid,
        attendedDays: row.totalDaysWorked,
        status: "processed",
        workingDays: TOTAL_DAYS,
        overtimeHours: 0,
        employeeName: member.name,
      };
      generatePayrollMutation.mutate(payrollData);
      count++;
    });
    toast({
      title: "Payroll Saved",
      description: `Generated payroll for ${count} employees.`,
    });
  };

  // ── CSV Export ─────────────────────────────────────────────────────────────
  const handleExportCSV = () => {
    const monthName = new Date(selectedYear, selectedMonth - 1).toLocaleString("default", { month: "long" });
    const headers = [
      "S.No",
      "Name of the Employee",
      "Total No.Days",
      "Absent",
      "Total Days Worked",
      "Salary",
      "Net Salary",
      "Deposit",
      "Deductions",
      "Reimbursment",
      "Amount Paid",
      "Remarks",
    ];

    const rows = filteredStaff.map((member, idx) => {
      const row = getRowData(member);
      return [
        idx + 1,
        row.name,
        row.totalNoDays,
        row.absent,
        row.totalDaysWorked,
        row.salary,
        Math.round(row.netSalary * 100) / 100,
        row.deposit,
        row.deductions,
        row.reimbursment,
        row.amountPaid,
        row.remarks,
      ];
    });

    // Totals row
    const totals = filteredStaff.reduce(
      (acc, member) => {
        const row = getRowData(member);
        acc.salary += row.salary;
        acc.netSalary += row.netSalary;
        acc.deposit += Number(row.deposit);
        acc.deductions += Number(row.deductions);
        acc.reimbursment += Number(row.reimbursment);
        acc.amountPaid += row.amountPaid;
        return acc;
      },
      { salary: 0, netSalary: 0, deposit: 0, deductions: 0, reimbursment: 0, amountPaid: 0 },
    );
    rows.push([
      "",
      "TOTAL",
      "",
      "",
      "",
      totals.salary,
      Math.round(totals.netSalary * 100) / 100,
      totals.deposit,
      totals.deductions,
      totals.reimbursment,
      totals.amountPaid,
      "",
    ]);

    const csvContent = [
      [`SALARY STATEMENT FOR THE MONTH OF ${monthName.toUpperCase()} ${selectedYear}`],
      [],
      headers,
      ...rows,
    ]
      .map((r) => r.map((f) => `"${f}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Salary_Statement_${monthName}_${selectedYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({ title: "Exported", description: "Salary statement exported as CSV." });
  };

  // ── Computed totals for footer ─────────────────────────────────────────────
  const totals = useMemo(() => {
    return filteredStaff.reduce(
      (acc, member) => {
        const row = getRowData(member);
        acc.salary += row.salary;
        acc.netSalary += row.netSalary;
        acc.deposit += Number(row.deposit);
        acc.deductions += Number(row.deductions);
        acc.reimbursment += Number(row.reimbursment);
        acc.amountPaid += row.amountPaid;
        return acc;
      },
      { salary: 0, netSalary: 0, deposit: 0, deductions: 0, reimbursment: 0, amountPaid: 0 },
    );
  }, [filteredStaff, getRowData]);

  const monthName = new Date(selectedYear, selectedMonth - 1).toLocaleString("default", {
    month: "long",
  });

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="px-4 md:px-8 pb-8">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search employee..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-[220px] bg-white border-gray-300 shadow-sm"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="flex items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-50"
            onClick={handleExportCSV}
          >
            <FileSpreadsheet className="h-4 w-4" />
            Export CSV
          </Button>
          <Button
            className="flex items-center gap-2 bg-[#643ae5] hover:bg-[#552dbf] text-white"
            onClick={handleSaveAll}
            disabled={generatePayrollMutation.isPending}
          >
            <Save className="h-4 w-4" />
            {generatePayrollMutation.isPending ? "Saving..." : "Save & Generate All"}
          </Button>
        </div>
      </div>

      {/* Salary Statement Card */}
      <Card className="border border-gray-200 shadow-md overflow-hidden">
        {/* Title Bar – mirrors spreadsheet header */}
        <div className="bg-gradient-to-r from-[#1a5632] to-[#2d7a4a] px-6 py-3">
          <h2 className="text-center text-white font-bold text-base tracking-wide uppercase">
            Salary Statement for the Month of {monthName} {selectedYear}
          </h2>
        </div>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              {/* Column Headers */}
              <thead>
                <tr className="bg-[#e8f0e8] border-b-2 border-[#4a8c62]">
                  <th className="px-3 py-3 text-left font-semibold text-gray-800 border-r border-gray-300 whitespace-nowrap w-8">
                    #
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-800 border-r border-gray-300 whitespace-nowrap min-w-[200px]">
                    Name of the Employee
                  </th>
                  <th className="px-3 py-3 text-center font-semibold text-gray-800 border-r border-gray-300 whitespace-nowrap">
                    Total No.Days
                  </th>
                  <th className="px-3 py-3 text-center font-semibold text-gray-800 border-r border-gray-300 whitespace-nowrap">
                    Absent
                  </th>
                  <th className="px-3 py-3 text-center font-semibold text-gray-800 border-r border-gray-300 whitespace-nowrap">
                    Total Days Worked
                  </th>
                  <th className="px-3 py-3 text-right font-semibold text-gray-800 border-r border-gray-300 whitespace-nowrap">
                    Salary
                  </th>
                  <th className="px-3 py-3 text-right font-semibold text-gray-800 border-r border-gray-300 whitespace-nowrap">
                    Net Salary
                  </th>
                  <th className="px-3 py-3 text-right font-semibold text-gray-800 border-r border-gray-300 whitespace-nowrap">
                    Deposit
                  </th>
                  <th className="px-3 py-3 text-right font-semibold text-gray-800 border-r border-gray-300 whitespace-nowrap">
                    Deductions
                  </th>
                  <th className="px-3 py-3 text-right font-semibold text-gray-800 border-r border-gray-300 whitespace-nowrap">
                    Reimbursment
                  </th>
                  <th className="px-3 py-3 text-right font-semibold text-gray-800 border-r border-gray-300 whitespace-nowrap bg-[#d4edda]">
                    Amount Paid
                  </th>
                  <th className="px-3 py-3 text-left font-semibold text-gray-800 whitespace-nowrap min-w-[120px]">
                    Remarks
                  </th>
                </tr>
              </thead>

              {/* Data rows */}
              <tbody>
                {filteredStaff.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="px-6 py-12 text-center text-gray-400">
                      No active employees found.
                    </td>
                  </tr>
                ) : (
                  filteredStaff.map((member, idx) => {
                    const row = getRowData(member);
                    const absentHighlight =
                      Number(row.absent) > 0 ? "bg-red-50 text-red-700 font-semibold" : "";

                    return (
                      <tr
                        key={member.id}
                        className="border-b border-gray-200 hover:bg-gray-50/60 transition-colors"
                      >
                        {/* S.No */}
                        <td className="px-3 py-2.5 text-center text-gray-500 border-r border-gray-100 font-medium">
                          {idx + 1}
                        </td>
                        {/* Name */}
                        <td className="px-4 py-2.5 border-r border-gray-100">
                          <div className="font-medium text-gray-900">{member.name}</div>
                          <div className="text-xs text-gray-500">{member.role}</div>
                        </td>
                        {/* Total No.Days */}
                        <td className="px-3 py-2.5 text-center border-r border-gray-100 text-gray-700">
                          {TOTAL_DAYS}
                        </td>

                        {/* Absent – editable */}
                        <td className={`px-1 py-1 text-center border-r border-gray-100 ${absentHighlight}`}>
                          <Input
                            type="number"
                            min={0}
                            max={TOTAL_DAYS}
                            value={row.absent}
                            onChange={(e) => handleCellChange(member.id, "absent", e.target.value)}
                            className="w-16 mx-auto text-center h-8 border-gray-300 focus:border-[#643ae5] focus:ring-[#643ae5]/20"
                          />
                        </td>

                        {/* Total Days Worked – computed */}
                        <td className="px-3 py-2.5 text-center border-r border-gray-100 font-medium text-gray-800">
                          {row.totalDaysWorked}
                        </td>

                        {/* Salary */}
                        <td className="px-3 py-2.5 text-right border-r border-gray-100 text-gray-700 tabular-nums">
                          {row.salary.toLocaleString("en-IN")}
                        </td>

                        {/* Net Salary – computed */}
                        <td className="px-3 py-2.5 text-right border-r border-gray-100 text-gray-700 tabular-nums">
                          {(Math.round(row.netSalary * 100) / 100).toLocaleString("en-IN", {
                            maximumFractionDigits: 2,
                          })}
                        </td>

                        {/* Deposit – editable */}
                        <td className="px-1 py-1 text-center border-r border-gray-100">
                          <Input
                            type="number"
                            min={0}
                            value={row.deposit}
                            onChange={(e) => handleCellChange(member.id, "deposit", e.target.value)}
                            className="w-20 mx-auto text-center h-8 border-gray-300 focus:border-[#643ae5] focus:ring-[#643ae5]/20"
                          />
                        </td>

                        {/* Deductions – editable */}
                        <td className="px-1 py-1 text-center border-r border-gray-100">
                          <Input
                            type="number"
                            min={0}
                            value={row.deductions}
                            onChange={(e) => handleCellChange(member.id, "deductions", e.target.value)}
                            className="w-20 mx-auto text-center h-8 border-gray-300 focus:border-[#643ae5] focus:ring-[#643ae5]/20"
                          />
                        </td>

                        {/* Reimbursment – editable */}
                        <td className="px-1 py-1 text-center border-r border-gray-100">
                          <Input
                            type="number"
                            min={0}
                            value={row.reimbursment}
                            onChange={(e) => handleCellChange(member.id, "reimbursment", e.target.value)}
                            className="w-20 mx-auto text-center h-8 border-gray-300 focus:border-[#643ae5] focus:ring-[#643ae5]/20"
                          />
                        </td>

                        {/* Amount Paid – computed, highlighted green */}
                        <td className="px-3 py-2.5 text-right border-r border-gray-100 font-bold bg-[#d4edda] text-green-800 tabular-nums">
                          {row.amountPaid.toLocaleString("en-IN")}
                        </td>

                        {/* Remarks – editable */}
                        <td className="px-1 py-1">
                          <Input
                            type="text"
                            value={row.remarks}
                            onChange={(e) => handleCellChange(member.id, "remarks", e.target.value)}
                            className="w-full h-8 border-gray-300 focus:border-[#643ae5] focus:ring-[#643ae5]/20 text-xs"
                            placeholder="—"
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>

              {/* Totals Footer */}
              {filteredStaff.length > 0 && (
                <tfoot>
                  <tr className="bg-[#e8f0e8] border-t-2 border-[#4a8c62] font-bold text-gray-900">
                    <td className="px-3 py-3 border-r border-gray-300" />
                    <td className="px-4 py-3 border-r border-gray-300 uppercase tracking-wide">
                      Total
                    </td>
                    <td className="px-3 py-3 border-r border-gray-300" />
                    <td className="px-3 py-3 border-r border-gray-300" />
                    <td className="px-3 py-3 border-r border-gray-300" />
                    <td className="px-3 py-3 text-right border-r border-gray-300 tabular-nums">
                      ₹{totals.salary.toLocaleString("en-IN")}
                    </td>
                    <td className="px-3 py-3 text-right border-r border-gray-300 tabular-nums">
                      ₹{Math.round(totals.netSalary).toLocaleString("en-IN")}
                    </td>
                    <td className="px-3 py-3 text-right border-r border-gray-300 tabular-nums">
                      ₹{totals.deposit.toLocaleString("en-IN")}
                    </td>
                    <td className="px-3 py-3 text-right border-r border-gray-300 tabular-nums">
                      ₹{totals.deductions.toLocaleString("en-IN")}
                    </td>
                    <td className="px-3 py-3 text-right border-r border-gray-300 tabular-nums">
                      ₹{totals.reimbursment.toLocaleString("en-IN")}
                    </td>
                    <td className="px-3 py-3 text-right border-r border-gray-300 bg-[#c3e6cb] text-green-900 tabular-nums">
                      ₹{totals.amountPaid.toLocaleString("en-IN")}
                    </td>
                    <td className="px-3 py-3" />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Pencil, Trash2, Plus, Wallet, TrendingUp, TrendingDown, ArrowDownCircle, ArrowUpCircle, Calendar, BookOpen, PieChart as PieChartIcon, Settings } from "lucide-react";
import Header from "@/components/layout/header";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest, invalidateNotifications } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NotificationManager } from "@/lib/notificationManager";
import { useOrganization } from "@/hooks/use-organization";
import { useEffect } from "react";

const outwardCategories = [
  "Salaries",
  "Rent",
  "Utilities & Bills",
  "School Supplies",
  "Maintenance",
  "Transportation",
  "Events",
  "Marketing",
  "Miscellaneous"
];

const inwardCategories = [
  "Budget Allocation",
  "Fee Collection",
  "Event Revenue",
  "Miscellaneous Income"
];

const transferCategories = [
  "Bank Deposit",
  "Bank Withdrawal"
];

interface Expense {
  id: number;
  amount: number;
  date: string;
  createdAt: string;
  description: string;
  category: string;
  deductFromBudget?: boolean;
  type?: string; // 'inward' | 'outward' | 'transfer'
  receiptNumber?: string | null;
}

export default function Expenses() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    description: "",
    amount: "",
    category: outwardCategories[0],
    deductFromBudget: false,
    type: "outward" as "inward" | "outward" | "transfer",
    receiptNumber: "",
  });
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  // Date Filtering State
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth().toString());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear().toString());

  const { settings: orgSettings, updateSettings, isLoading: isOrgLoading } = useOrganization();

  // Monthly Budget State (persisted in organization settings)
  const [monthlyBudget, setMonthlyBudget] = useState(0);
  const [isBudgetDialogOpen, setIsBudgetDialogOpen] = useState(false);
  const [newBudget, setNewBudget] = useState("0");

  // Sync state with organization settings when loaded
  useEffect(() => {
    if (orgSettings?.baseBudget !== undefined) {
      const budget = Number(orgSettings.baseBudget);
      setMonthlyBudget(budget);
      setNewBudget(budget.toString());
    }
  }, [orgSettings]);

  const handleBudgetUpdate = () => {
    const budget = parseInt(newBudget);
    if (isNaN(budget) || budget < 0) return;
    
    // Update server settings
    updateSettings({
      ...orgSettings,
      baseBudget: budget
    });
    
    setMonthlyBudget(budget);
    setIsBudgetDialogOpen(false);
  };

  // Fetch all expenses
  const { data: allExpenses = [], isLoading } = useQuery({
    queryKey: ['/api/expenses'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/expenses');
      return await response.json();
    },
  });

  // Filter expenses based on selected month and year
  const monthFilteredExpenses = allExpenses.filter((exp: Expense) => {
    const [y, m] = exp.date.split('-').map(Number);
    return (m - 1) === parseInt(selectedMonth) && y === parseInt(selectedYear);
  });

  // Further filter by tab
  const expenses = activeTab === "all"
    ? monthFilteredExpenses
    : monthFilteredExpenses.filter((exp: Expense) => (exp.type ?? "outward") === activeTab);

  // Calculations
  const totalInward = monthFilteredExpenses
    .filter((exp: Expense) => (exp.type ?? "outward") === "inward")
    .reduce((sum: number, exp: Expense) => sum + Number(exp.amount), 0);

  const totalOutward = monthFilteredExpenses
    .filter((exp: Expense) => (exp.type ?? "outward") === "outward")
    .reduce((sum: number, exp: Expense) => sum + Number(exp.amount), 0);
    
  // Calculate budget across ALL time (carry forward / overall budget)
  const additionalBudgetFromInwards = allExpenses
    .filter((exp: Expense) => (exp.type ?? "outward") === "inward" && exp.category === "Budget Allocation")
    .reduce((sum: number, exp: Expense) => sum + Number(exp.amount), 0);
    
  const budgetDeductions = allExpenses
    .filter((exp: Expense) => (exp.type ?? "outward") === "outward" && exp.deductFromBudget)
    .reduce((sum: number, exp: Expense) => sum + Number(exp.amount), 0);

  const effectiveBudget = monthlyBudget + additionalBudgetFromInwards - budgetDeductions;

  // We recalculate current balance to be based on the original base budget calculation minus all outward 
  // expenses, or we can just leave it since the user asked to remove the "Current Balance" card anyway.

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Create expense mutation
  const createExpenseMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/expenses", data);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
      invalidateNotifications(queryClient);
      const actionTxt = form.type === "inward" ? "Inward entry added" : form.type === "transfer" ? "Transfer recorded" : "Expense added successfully";
      toast({ title: "Success", description: actionTxt });
      
      // Activity Log
      NotificationManager.createExpenseNotification({
        amount: parseFloat(variables.amount || "0"),
        category: variables.category || "General",
        description: variables.description || ""
      }).catch(err => console.error("Failed to create activity log:", err));

      resetForm();
      setIsAddExpenseOpen(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add entry", variant: "destructive" });
    },
  });

  // Update expense mutation
  const updateExpenseMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("PUT", `/api/expenses/${data.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
      invalidateNotifications(queryClient);
      toast({ title: "Success", description: "Entry updated successfully" });
      resetForm();
      setIsAddExpenseOpen(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update entry", variant: "destructive" });
    },
  });

  // Delete expense mutation
  const deleteExpenseMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/expenses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
      invalidateNotifications(queryClient);
      toast({ title: "Success", description: "Entry deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete entry", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setForm({
      description: "",
      amount: "",
      category: outwardCategories[0],
      deductFromBudget: false,
      type: "outward",
      receiptNumber: "",
    });
    setEditingExpense(null);
  };

  const handleAddExpense = () => {
    if (!form.description || !form.amount) return;

    const now = new Date();
    const isCurrentMonth = parseInt(selectedMonth) === now.getMonth() && parseInt(selectedYear) === now.getFullYear();
    const effectiveDay = isCurrentMonth ? now.getDate() : 1;
    const effectiveDate = new Date(parseInt(selectedYear), parseInt(selectedMonth), effectiveDay);
    const dateStr = format(effectiveDate, 'yyyy-MM-dd');

    const payload = {
      description: form.description,
      amount: form.amount,
      category: form.category,
      date: dateStr,
      deductFromBudget: form.type === "outward" ? form.deductFromBudget : false,
      type: form.type,
      receiptNumber: form.receiptNumber || null,
    };

    if (editingExpense) {
      updateExpenseMutation.mutate({ id: editingExpense.id, ...payload });
    } else {
      createExpenseMutation.mutate(payload);
    }
  };

  const handleEdit = (expense: Expense) => {
    const expType = (expense.type ?? "outward") as "inward" | "outward" | "transfer";
    setEditingExpense(expense);
    setForm({
      description: expense.description,
      amount: expense.amount.toString(),
      category: expense.category,
      deductFromBudget: expense.deductFromBudget ?? false,
      type: expType,
      receiptNumber: expense.receiptNumber || "",
    });
    setIsAddExpenseOpen(true);
  };

  const handleDelete = (id: number) => {
    deleteExpenseMutation.mutate(id);
  };

  const openAddModal = (type: "inward" | "outward" | "transfer") => {
    resetForm();
    const cats = type === "inward" ? inwardCategories : type === "transfer" ? transferCategories : outwardCategories;
    setForm({
      description: "",
      amount: "",
      category: cats[0],
      deductFromBudget: false,
      type,
      receiptNumber: "",
    });
    setIsAddExpenseOpen(true);
  };

  const currentCategories = form.type === "inward" ? inwardCategories : form.type === "transfer" ? transferCategories : outwardCategories;

  return (
    <div className="min-h-screen bg-gray-50/50 pb-8">
      <Header title="Expenses & Cash Ledger" subtitle="Track your school's inward and outward cash flow." />

      <main className="w-full px-6 py-8 space-y-8">
        {/* Date Filter */}
        <div className="flex flex-col md:flex-row md:items-center justify-end gap-4">
          <div className="flex items-center gap-3 bg-white p-1.5 rounded-lg border shadow-sm">
            <div className="flex items-center gap-2 px-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[130px] border-0 bg-transparent h-8 focus:ring-0">
                  <SelectValue placeholder="Select Month" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i} value={i.toString()}>
                      {format(new Date(2025, i, 1), "MMMM")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="w-px h-4 bg-gray-200 mx-1" />
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-[90px] border-0 bg-transparent h-8 focus:ring-0">
                  <SelectValue placeholder="Select Year" />
                </SelectTrigger>
                <SelectContent>
                  {[2024, 2025, 2026, 2027].map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Inward */}
          <Card className="shadow-sm border border-gray-100 hover:shadow-md transition-all rounded-2xl">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">Total Inward</p>
                  <h3 className="text-3xl font-bold text-gray-900 tracking-tight">₹{totalInward.toLocaleString()}</h3>
                </div>
                <div className="p-2 bg-emerald-50/80 rounded-full">
                  <ArrowDownCircle className="h-5 w-5 text-emerald-600" />
                </div>
              </div>
              <div className="mt-6 flex items-center text-sm">
                <TrendingUp className="h-4 w-4 mr-1.5 text-emerald-500" />
                <span className="text-emerald-600 font-medium">Funds received this month</span>
              </div>
            </CardContent>
          </Card>

          {/* Total Outward */}
          <Card className="shadow-sm border border-gray-100 hover:shadow-md transition-all rounded-2xl">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">Total Outward</p>
                  <h3 className="text-3xl font-bold text-gray-900 tracking-tight">₹{totalOutward.toLocaleString()}</h3>
                </div>
                <div className="p-2 bg-red-50/80 rounded-full">
                  <ArrowUpCircle className="h-5 w-5 text-red-500" />
                </div>
              </div>
              <div className="mt-6 flex items-center text-sm">
                <TrendingDown className="h-4 w-4 mr-1.5 text-red-400" />
                <span className="text-red-500 font-medium">Expenses this month</span>
              </div>
            </CardContent>
          </Card>

          {/* Current Balance removed per user request */}

          {/* Monthly Budget */}
          <Card className="shadow-sm border border-gray-100 hover:shadow-md transition-all rounded-2xl">
            <CardContent className="p-6 flex flex-col justify-between h-full">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">Effective Budget</p>
                  <h3 className="text-3xl font-bold text-gray-900 tracking-tight">₹{effectiveBudget.toLocaleString()}</h3>
                </div>
                <div className="p-2 bg-purple-50/80 rounded-full">
                  <PieChartIcon className="h-5 w-5 text-purple-600" />
                </div>
              </div>
              <div className="mt-6 flex flex-col gap-3">
                <div className="flex items-center text-xs font-medium justify-between">
                  <span className="text-gray-500">Base: ₹{monthlyBudget.toLocaleString()}</span>
                  <div className="flex gap-2">
                    {budgetDeductions > 0 && <span className="text-red-500">-₹{budgetDeductions.toLocaleString()}</span>}
                    {additionalBudgetFromInwards > 0 && <span className="text-purple-500">+₹{additionalBudgetFromInwards.toLocaleString()}</span>}
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full text-purple-600 border-purple-100 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 h-9 text-xs font-semibold rounded-xl bg-purple-50/30"
                  onClick={() => setIsBudgetDialogOpen(true)}
                >
                  Adjust Base Limit
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ledger Table with Tabs */}
        <Card className="shadow-sm border-none ring-1 ring-gray-200">
          <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-h3">Cash Ledger</CardTitle>
              <CardDescription className="text-body text-gray-500">
                Record and track all inward and outward cash flow
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={() => openAddModal("inward")} variant="outline" className="rounded-full border-emerald-300 text-emerald-700 hover:bg-emerald-50 gap-2 font-medium px-4">
                <ArrowDownCircle className="h-4 w-4" />
                Add Inward
              </Button>
              <Button onClick={() => openAddModal("transfer")} variant="outline" className="rounded-full border-blue-300 text-blue-700 hover:bg-blue-50 gap-2 font-medium px-4">
                <BookOpen className="h-4 w-4" />
                Transfer
              </Button>
              <Button onClick={() => openAddModal("outward")} className="rounded-full bg-purple-600 hover:bg-purple-700 text-white shadow-sm gap-2 font-medium px-4">
                <Plus className="h-4 w-4" />
                Add Expense
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {/* Tab Filter */}
            <div className="px-6 pt-2 pb-0">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-gray-100/80 p-1 flex-wrap h-auto">
                  <TabsTrigger value="all" className="data-[state=active]:bg-white data-[state=active]:shadow-sm text-sm">All</TabsTrigger>
                  <TabsTrigger value="inward" className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm text-sm">Inward</TabsTrigger>
                  <TabsTrigger value="transfer" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-sm text-sm">Transfers</TabsTrigger>
                  <TabsTrigger value="outward" className="data-[state=active]:bg-red-50 data-[state=active]:text-red-700 data-[state=active]:shadow-sm text-sm">Outward</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="overflow-x-auto mt-4">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="table-header px-6 py-4 text-left text-xs font-bold text-gray-800 uppercase tracking-wider">Date</th>
                    <th className="table-header px-6 py-4 text-left text-xs font-bold text-gray-800 uppercase tracking-wider">Type</th>
                    <th className="table-header px-6 py-4 text-left text-xs font-bold text-gray-800 uppercase tracking-wider">Description</th>
                    <th className="table-header px-6 py-4 text-left text-xs font-bold text-gray-800 uppercase tracking-wider">Category</th>
                    <th className="table-header px-6 py-4 text-left text-xs font-bold text-gray-800 uppercase tracking-wider">Amount</th>
                    <th className="table-header px-6 py-4 text-right text-xs font-bold text-gray-800 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {expenses.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Wallet className="h-8 w-8 text-gray-300" />
                          <p>No entries recorded for this month.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    expenses.map((exp: Expense) => {
                      const isInward = (exp.type ?? "outward") === "inward";
                      const isTransfer = exp.type === "transfer";
                      
                      let badgeUI = null;
                      if (isInward) {
                        badgeUI = (
                          <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-200 font-medium gap-1">
                            <ArrowDownCircle className="h-3 w-3" />
                            Inward
                          </Badge>
                        );
                      } else if (isTransfer) {
                        badgeUI = (
                          <Badge className="bg-blue-100 text-blue-700 border border-blue-200 font-medium gap-1">
                            <BookOpen className="h-3 w-3" />
                            Transfer
                          </Badge>
                        );
                      } else {
                        badgeUI = (
                          <Badge className="bg-red-100 text-red-700 border border-red-200 font-medium gap-1">
                            <ArrowUpCircle className="h-3 w-3" />
                            Outward
                          </Badge>
                        );
                      }
                      
                      return (
                        <tr key={exp.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span>{format(new Date(exp.date), "MMM d, yyyy")}</span>
                              {exp.receiptNumber && (
                                <span className="text-xs text-gray-400 mt-0.5">#{exp.receiptNumber}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {badgeUI}
                          </td>
                          <td className="px-6 py-4 font-medium text-gray-900">
                            {exp.description}
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant="secondary" className="bg-gray-100 text-gray-700 hover:bg-gray-200 border-0 font-normal">
                              {exp.category}
                            </Badge>
                          </td>
                          <td className={`px-6 py-4 font-semibold ${isInward ? 'text-emerald-700' : isTransfer ? 'text-blue-600' : 'text-red-600'}`}>
                            {isInward ? '+' : isTransfer ? '↔' : '-'}₹{Number(exp.amount).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleEdit(exp)}
                                className="h-8 w-8 rounded-full text-gray-500 hover:text-purple-600 hover:bg-purple-50 hover:border-purple-200"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleDelete(exp.id)}
                                className="h-8 w-8 rounded-full text-gray-500 hover:text-red-600 hover:bg-red-50 hover:border-red-200"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Add/Edit Transaction Modal */}
        <Dialog open={isAddExpenseOpen} onOpenChange={setIsAddExpenseOpen}>
          <DialogContent className="sm:max-w-[500px] border-0 shadow-2xl bg-gradient-to-br from-white via-white to-purple-50/30 backdrop-blur-xl">
            <DialogHeader className="pb-4 border-b border-purple-100/50">
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                {editingExpense ? "Edit Entry" : form.type === "inward" ? "Add Inward Cash" : form.type === "transfer" ? "Record Transfer" : "Log New Expense"}
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                {form.type === "inward"
                  ? "Record cash coming into the school (budget, fees, donations, etc.)"
                  : form.type === "transfer"
                  ? "Record money moved between accounts, like a bank deposit or withdrawal."
                  : "Enter the details of the business expense."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-5 py-5">
              {/* Type Selector */}
              <div className="space-y-2.5">
                <Label className="text-sm font-semibold text-gray-700">Transaction Type</Label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setForm({ ...form, type: "inward", category: inwardCategories[0], deductFromBudget: false });
                    }}
                    className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all duration-200 text-sm font-medium ${
                      form.type === "inward"
                        ? "border-emerald-400 bg-emerald-50 text-emerald-700 shadow-sm"
                        : "border-gray-200 text-gray-500 hover:border-emerald-300 hover:bg-emerald-50/50"
                    }`}
                  >
                    <ArrowDownCircle className="h-4 w-4" />
                    Inward
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setForm({ ...form, type: "transfer", category: transferCategories[0], deductFromBudget: false });
                    }}
                    className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all duration-200 text-sm font-medium ${
                      form.type === "transfer"
                        ? "border-blue-400 bg-blue-50 text-blue-700 shadow-sm"
                        : "border-gray-200 text-gray-500 hover:border-blue-300 hover:bg-blue-50/50"
                    }`}
                  >
                    <BookOpen className="h-4 w-4" />
                    Transfer
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setForm({ ...form, type: "outward", category: outwardCategories[0] });
                    }}
                    className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all duration-200 text-sm font-medium ${
                      form.type === "outward"
                        ? "border-red-400 bg-red-50 text-red-700 shadow-sm"
                        : "border-gray-200 text-gray-500 hover:border-red-300 hover:bg-red-50/50"
                    }`}
                  >
                    <ArrowUpCircle className="h-4 w-4" />
                    Outward
                  </button>
                </div>
              </div>

              <div className={`grid gap-4 ${form.type === "transfer" ? "grid-cols-2" : "grid-cols-1"}`}>
                <div className="space-y-2.5">
                  <Label htmlFor="description" className="text-sm font-semibold text-gray-700">Description</Label>
                  <Input
                    id="description"
                    name="description"
                    placeholder={form.type === "inward" ? "e.g. Monthly Budget, Parent Donation" : form.type === "transfer" ? "e.g. Deposited cash to bank" : "e.g. Printer Paper, Annual Party"}
                    value={form.description}
                    onChange={handleChange}
                    className="h-11 border-gray-200 focus:border-purple-400 focus:ring-purple-400/20 transition-all duration-200"
                  />
                </div>
                {form.type === "transfer" && (
                  <div className="space-y-2.5">
                    <Label htmlFor="receiptNumber" className="text-sm font-semibold text-gray-700">
                      Receipt / Ref No. <span className="text-gray-400 font-normal">(Optional)</span>
                    </Label>
                    <Input
                      id="receiptNumber"
                      name="receiptNumber"
                      placeholder="e.g. REC-1209"
                      value={form.receiptNumber}
                      onChange={handleChange}
                      className="h-11 border-gray-200 focus:border-purple-400 focus:ring-purple-400/20 transition-all duration-200"
                    />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2.5">
                  <Label htmlFor="category" className="text-sm font-semibold text-gray-700">Category</Label>
                  <Select
                    value={form.category}
                    onValueChange={(value) => setForm({ ...form, category: value })}
                  >
                    <SelectTrigger className="w-full h-11 border-gray-200 focus:ring-purple-400/20 focus:border-purple-400">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {currentCategories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="amount" className="text-sm font-semibold text-gray-700">Amount (₹)</Label>
                  <Input
                    id="amount"
                    name="amount"
                    type="number"
                    placeholder="0.00"
                    value={form.amount}
                    onChange={handleChange}
                    min="0"
                    className="h-11 border-gray-200 focus:border-purple-400 focus:ring-purple-400/20 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Budget Deduction Checkbox — only for outward */}
              {form.type === "outward" && (
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-100/50 shadow-sm transition-all duration-200 hover:shadow-md">
                  <div className="flex items-start gap-3">
                    <div className="flex items-center h-6">
                      <input
                        type="checkbox"
                        id="deductFromBudget"
                        checked={form.deductFromBudget}
                        onChange={(e) => setForm({ ...form, deductFromBudget: e.target.checked })}
                        className="w-5 h-5 text-purple-600 bg-white border-purple-300 rounded focus:ring-purple-500 focus:ring-2 transition-all duration-200 cursor-pointer"
                      />
                    </div>
                    <div className="flex-1">
                      <label htmlFor="deductFromBudget" className="text-sm font-semibold text-gray-800 cursor-pointer flex items-center gap-2">
                        <Wallet className="h-4 w-4 text-purple-600" />
                        Deduct from Budget
                      </label>
                      <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                        Check this if this expense should reduce your available budget. Leave unchecked for tracking-only expenses.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className={`p-3.5 rounded-lg flex gap-2.5 items-start text-xs border ${
                form.type === "inward"
                  ? "bg-emerald-50/50 text-emerald-700 border-emerald-100/50"
                  : "bg-blue-50/50 text-blue-700 border-blue-100/50"
              }`}>
                <Calendar className={`h-4 w-4 mt-0.5 shrink-0 ${form.type === "inward" ? "text-emerald-600" : "text-blue-600"}`} />
                <span className="leading-relaxed">
                  {(() => {
                    const now = new Date();
                    const isCurrentMonth = parseInt(selectedMonth) === now.getMonth() && parseInt(selectedYear) === now.getFullYear();
                    const effectiveDay = isCurrentMonth ? now.getDate() : 1;
                    const effectiveDate = new Date(parseInt(selectedYear), parseInt(selectedMonth), effectiveDay);
                    return <>This entry will be recorded for <strong className="font-semibold">{format(effectiveDate, "MMMM d, yyyy")}</strong>.</>;
                  })()}
                </span>
              </div>
            </div>
            <DialogFooter className="pt-4 border-t border-purple-100/50 gap-2">
              <Button
                variant="outline"
                onClick={() => setIsAddExpenseOpen(false)}
                className="border-gray-300 hover:bg-gray-50 transition-all duration-200"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddExpense}
                className={`text-white shadow-lg hover:shadow-xl transition-all duration-200 ${
                  form.type === "inward"
                    ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                    : form.type === "transfer"
                    ? "bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
                    : "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                }`}
              >
                {editingExpense ? "Save Changes" : form.type === "inward" ? "Record Inward" : form.type === "transfer" ? "Record Transfer" : "Create Expense"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Budget Settings Modal */}
        <Dialog open={isBudgetDialogOpen} onOpenChange={setIsBudgetDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-xl">Budget Settings</DialogTitle>
              <DialogDescription className="text-gray-600">
                Set your overall base spending limit to track budget utilization across all time.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 pt-4">
              <div className="space-y-2">
                <Label htmlFor="budget" className="text-sm font-medium">Budget Amount (₹)</Label>
                <Input
                  id="budget"
                  type="number"
                  value={newBudget}
                  onChange={(e) => setNewBudget(e.target.value)}
                  min="0"
                  step="1000"
                  className="h-10"
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsBudgetDialogOpen(false)} className="h-10">
                  Cancel
                </Button>
                <Button onClick={handleBudgetUpdate} className="h-10">
                  Save Budget
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}

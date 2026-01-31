import { useState } from "react";
import { useQueryState } from "@/hooks/use-query-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Pencil, Trash2, Settings, Filter, Plus, Wallet, TrendingUp, TrendingDown, PieChart as PieChartIcon, Calendar } from "lucide-react";
import Header from "@/components/layout/header";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest, invalidateNotifications } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge"; // Ensure Badge is imported
import { format } from "date-fns";
// Recharts components removed as no charts are currently displayed on this page

const categories = [
  "School Supplies",
  "Salaries",
  "Rent",
  "Utilities and Bills",
  "Marketing",
  "Software Subscriptions",
  "Maintenance",
  "Furniture",
  "Events",
  "Transportation",
  "Legal Fees",
  "Security",
  "Textbooks",
  "Miscellaneous"
];

const COLORS = ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#6366f1', '#a855f7', '#d946ef', '#f43f5e', '#f97316'];



interface Expense {
  id: number;
  amount: number;
  date: string;
  createdAt: string;
  description: string;
  category: string;
  deductFromBudget?: boolean;
}

export default function Expenses() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ description: "", amount: "", category: categories[0], deductFromBudget: false });
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);

  // Date Filtering State
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth().toString());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear().toString());

  const [monthlyBudget, setMonthlyBudget] = useState(() => {
    const saved = localStorage.getItem("monthlyBudget");
    return saved ? parseInt(saved) : 100000;
  });

  const [isBudgetDialogOpen, setIsBudgetDialogOpen] = useState(false);
  const [newBudget, setNewBudget] = useState(monthlyBudget.toString());


  // Fetch all expenses
  const { data: allExpenses = [], isLoading } = useQuery({
    queryKey: ['/api/expenses'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/expenses');
      return await response.json();
    },
  });

  // Filter expenses based on selected month and year
  const expenses = allExpenses.filter((exp: Expense) => {
    // Parse YYYY-MM-DD manually to avoid timezone shifts
    const [y, m] = exp.date.split('-').map(Number);
    return (m - 1) === parseInt(selectedMonth) && y === parseInt(selectedYear);
  });

  const totalExpenses = expenses.filter((exp: Expense) => exp.deductFromBudget).reduce((sum: number, exp: Expense) => sum + Number(exp.amount), 0);
  const remainingBudget = monthlyBudget - totalExpenses;

  // Handle division by zero
  const budgetUtilization = monthlyBudget > 0 ? (totalExpenses / monthlyBudget) * 100 : 0;

  // Prepare Chart Data
  const categoryData = expenses.reduce((acc: any[], curr: Expense) => {
    const existing = acc.find(item => item.name === curr.category);
    if (existing) {
      existing.value += Number(curr.amount);
    } else {
      acc.push({ name: curr.category, value: Number(curr.amount) });
    }
    return acc;
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Create expense mutation
  const createExpenseMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/expenses", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
      invalidateNotifications(queryClient);
      toast({ title: "Success", description: "Expense added successfully" });
      setForm({ description: "", amount: "", category: categories[0], deductFromBudget: false });
      setEditingExpense(null);
      setIsAddExpenseOpen(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add expense", variant: "destructive" });
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
      toast({ title: "Success", description: "Expense updated successfully" });
      setForm({ description: "", amount: "", category: categories[0], deductFromBudget: false });
      setEditingExpense(null);
      setIsAddExpenseOpen(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update expense", variant: "destructive" });
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
      toast({ title: "Success", description: "Expense deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete expense", variant: "destructive" });
    },
  });

  const handleAddExpense = () => {
    if (!form.description || !form.amount) return;

    // Use current day if it's the current month/year, otherwise default to the 1st
    const now = new Date();
    const isCurrentMonth = parseInt(selectedMonth) === now.getMonth() && parseInt(selectedYear) === now.getFullYear();
    const effectiveDay = isCurrentMonth ? now.getDate() : 1;
    const effectiveDate = new Date(parseInt(selectedYear), parseInt(selectedMonth), effectiveDay);
    const dateStr = format(effectiveDate, 'yyyy-MM-dd');

    if (editingExpense) {
      updateExpenseMutation.mutate({
        id: editingExpense.id,
        description: form.description,
        amount: form.amount,
        category: form.category,
        date: dateStr,
        deductFromBudget: form.deductFromBudget,
      });
    } else {
      createExpenseMutation.mutate({
        description: form.description,
        amount: form.amount,
        category: form.category,
        date: dateStr,
        deductFromBudget: form.deductFromBudget,
      });
    }
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setForm({
      description: expense.description,
      amount: expense.amount.toString(),
      category: expense.category,
      deductFromBudget: expense.deductFromBudget ?? false,
    });
    setIsAddExpenseOpen(true);
  };

  const handleDelete = (id: number) => {
    deleteExpenseMutation.mutate(id);
  };

  const handleBudgetUpdate = () => {
    const budget = parseInt(newBudget);
    if (isNaN(budget) || budget < 0) return;

    setMonthlyBudget(budget);
    localStorage.setItem("monthlyBudget", budget.toString());
    setIsBudgetDialogOpen(false);
  };



  const openAddModal = () => {
    setEditingExpense(null);
    setForm({ description: "", amount: "", category: categories[0], deductFromBudget: false });
    setIsAddExpenseOpen(true);
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-8">
      <Header title="Expenses" subtitle="Manage and track your school's financial outflows." />

      <main className="w-full px-6 py-8 space-y-8">
        {/* Header Section */}
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
          <Card className="shadow-sm border-l-4 border-l-purple-500 hover:shadow-md transition-all">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Spent</p>
                  <h3 className="text-2xl font-bold text-gray-900 mt-2">₹{totalExpenses.toLocaleString()}</h3>
                </div>
                <div className="p-2 bg-purple-50 rounded-lg">
                  <Wallet className="h-5 w-5 text-purple-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-gray-500">
                {monthlyBudget > 0 ? (
                  <>
                    <span className="text-purple-600 font-medium">{budgetUtilization.toFixed(0)}%</span>
                    <span className="ml-1">of budget</span>
                  </>
                ) : (
                  <span className="text-gray-400 font-medium">No budget limit set</span>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-l-4 border-l-emerald-500 hover:shadow-md transition-all">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500">Remaining</p>
                  <h3 className="text-2xl font-bold text-gray-900 mt-2">
                    {monthlyBudget > 0 ? `₹${remainingBudget.toLocaleString()}` : 'N/A'}
                  </h3>
                </div>
                <div className="p-2 bg-emerald-50 rounded-lg">
                  <TrendingDown className="h-5 w-5 text-emerald-600" />
                </div>
              </div>
              <Progress value={Math.min(budgetUtilization, 100)} className="h-1.5 mt-4 bg-emerald-100" />
            </CardContent>
          </Card>

          <Card className="shadow-sm border-l-4 border-l-blue-500 hover:shadow-md transition-all">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500">Budget</p>
                  <h3 className="text-2xl font-bold text-gray-900 mt-2">₹{monthlyBudget.toLocaleString()}</h3>
                </div>
                <div className="p-2 bg-blue-50 rounded-lg">
                  <PieChartIcon className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full mt-4 text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700 h-9 text-sm font-medium"
                onClick={() => setIsBudgetDialogOpen(true)}
              >
                Adjust Limit
              </Button>
            </CardContent>
          </Card>

        </div>

        {/* Main Content Layout */}
        <div className="space-y-6">

          {/* Left Column: Expense List */}
          <div className="w-full space-y-6">
            <Card className="shadow-sm h-full border-none ring-1 ring-gray-200">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-h3">Recent Expenses</CardTitle>
                  <CardDescription className="text-body text-gray-500">
                    Manage and track your recent expenditure
                  </CardDescription>
                </div>
                <Button onClick={openAddModal} className="bg-purple-600 hover:bg-purple-700 text-white shadow-sm gap-2">
                  <Plus className="h-4 w-4" />
                  Add Expense
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50/50">
                      <tr>
                        <th className="table-header px-6 py-3 text-left">Date</th>
                        <th className="table-header px-6 py-3 text-left">Description</th>
                        <th className="table-header px-6 py-3 text-left">Category</th>
                        <th className="table-header px-6 py-3 text-left">Amount</th>
                        <th className="table-header px-6 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {expenses.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <Wallet className="h-8 w-8 text-gray-300" />
                              <p>No expenses recorded for this month.</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        expenses.map((exp: Expense) => (
                          <tr key={exp.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                              {/* Assuming date format YYYY-MM-DD */}
                              {format(new Date(exp.date), "MMM d, yyyy")}
                            </td>
                            <td className="px-6 py-4 font-medium text-gray-900">
                              {exp.description}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="bg-gray-100 text-gray-700 hover:bg-gray-200 border-0 font-normal">
                                  {exp.category}
                                </Badge>
                                {exp.deductFromBudget && (
                                  <Badge className="bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 border border-purple-200 font-medium shadow-sm">
                                    <Wallet className="h-3 w-3 mr-1" />
                                    Budget
                                  </Badge>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 font-semibold text-gray-900">
                              ₹{exp.amount.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEdit(exp)}
                                  className="h-8 w-8 text-gray-500 hover:text-purple-600 hover:bg-purple-50"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDelete(exp.id)}
                                  className="h-8 w-8 text-gray-500 hover:text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

        </div>

        {/* Add/Edit Expense Modal - Premium Design */}
        <Dialog open={isAddExpenseOpen} onOpenChange={setIsAddExpenseOpen}>
          <DialogContent className="sm:max-w-[500px] border-0 shadow-2xl bg-gradient-to-br from-white via-white to-purple-50/30 backdrop-blur-xl">
            <DialogHeader className="pb-4 border-b border-purple-100/50">
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                {editingExpense ? "Edit Expense" : "Log New Expense"}
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                {editingExpense ? "Update the details of this transaction." : "Enter the details of the new business expense."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-5 py-5">
              <div className="space-y-2.5">
                <Label htmlFor="description" className="text-sm font-semibold text-gray-700">Description</Label>
                <Input
                  id="description"
                  name="description"
                  placeholder="e.g. Printer Paper, Annual Party"
                  value={form.description}
                  onChange={handleChange}
                  className="h-11 border-gray-200 focus:border-purple-400 focus:ring-purple-400/20 transition-all duration-200"
                />
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
                      {categories.map((cat) => (
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

              {/* Budget Deduction Checkbox - Premium Design */}
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

              <div className="bg-blue-50/50 p-3.5 rounded-lg flex gap-2.5 items-start text-xs text-blue-700 border border-blue-100/50">
                <Calendar className="h-4 w-4 mt-0.5 shrink-0 text-blue-600" />
                <span className="leading-relaxed">
                  {(() => {
                    const now = new Date();
                    const isCurrentMonth = parseInt(selectedMonth) === now.getMonth() && parseInt(selectedYear) === now.getFullYear();
                    const effectiveDay = isCurrentMonth ? now.getDate() : 1;
                    const effectiveDate = new Date(parseInt(selectedYear), parseInt(selectedMonth), effectiveDay);
                    return <>This expense will be recorded for <strong className="font-semibold">{format(effectiveDate, "MMMM d, yyyy")}</strong>.</>;
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
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {editingExpense ? "Save Changes" : "Create Expense"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Budget Settings Modal (Keep logic, refresh UI if needed) */}
        <Dialog open={isBudgetDialogOpen} onOpenChange={setIsBudgetDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-xl">Budget Settings</DialogTitle>
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
        </Dialog >
      </main >
    </div >
  );
}

import { useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge"; // Ensure Badge is imported
import { format } from "date-fns";
// Recharts components removed as no charts are currently displayed on this page

const categories = [
  "School Supplies",
  "Salaries",
  "Rent",
  "Utilities",
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

interface CategoryBudget {
  category: string;
  amount: number;
}

interface Expense {
  id: number;
  amount: number;
  date: string;
  createdAt: string;
  description: string;
  category: string;
}

export default function Expenses() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ description: "", amount: "", category: categories[0] });
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
  const [categoryBudgets, setCategoryBudgets] = useState<CategoryBudget[]>(() => {
    const saved = localStorage.getItem("categoryBudgets");
    return saved ? JSON.parse(saved) : categories.map(cat => ({ category: cat, amount: 0 }));
  });
  const [isBudgetDialogOpen, setIsBudgetDialogOpen] = useState(false);
  const [newBudget, setNewBudget] = useState(monthlyBudget.toString());
  const [activeTab, setActiveTab] = useState("overall");
  const [selectedCategory, setSelectedCategory] = useState(categories[0]);

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

  const totalExpenses = expenses.reduce((sum: number, exp: Expense) => sum + Number(exp.amount), 0);
  const remainingBudget = monthlyBudget - totalExpenses;
  const budgetUtilization = (totalExpenses / monthlyBudget) * 100;

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
      setForm({ description: "", amount: "", category: categories[0] });
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
      setForm({ description: "", amount: "", category: categories[0] });
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
        date: dateStr
      });
    } else {
      createExpenseMutation.mutate({
        description: form.description,
        amount: form.amount,
        category: form.category,
        date: dateStr
      });
    }
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setForm({
      description: expense.description,
      amount: expense.amount.toString(),
      category: expense.category,
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

  const handleCategoryBudgetUpdate = (category: string, amount: string) => {
    const newAmount = parseInt(amount);
    if (isNaN(newAmount) || newAmount < 0) return;

    const updatedBudgets = categoryBudgets.map(cb =>
      cb.category === category ? { ...cb, amount: newAmount } : cb
    );

    setCategoryBudgets(updatedBudgets);
    localStorage.setItem("categoryBudgets", JSON.stringify(updatedBudgets));
  };

  const openAddModal = () => {
    setEditingExpense(null);
    setForm({ description: "", amount: "", category: categories[0] });
    setIsAddExpenseOpen(true);
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-8">
      <Header />

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Expenses</h1>
            <p className="text-gray-500 mt-1">Manage and track your school's financial outflows.</p>
          </div>

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
                <span className="text-purple-600 font-medium">{budgetUtilization.toFixed(0)}%</span>
                <span className="ml-1">of monthly budget</span>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-l-4 border-l-emerald-500 hover:shadow-md transition-all">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500">Remaining</p>
                  <h3 className="text-2xl font-bold text-gray-900 mt-2">₹{remainingBudget.toLocaleString()}</h3>
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
                  <p className="text-sm font-medium text-gray-500">Monthly Budget</p>
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
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6 border-b px-6 pt-6">
                <div>
                  <CardTitle>Transactions</CardTitle>
                  <CardDescription className="mt-1">
                    {format(new Date(parseInt(selectedYear), parseInt(selectedMonth)), "MMMM yyyy")}
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
                    <thead className="bg-gray-50/50 text-gray-500 font-medium border-b">
                      <tr>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Description</th>
                        <th className="px-6 py-4">Category</th>
                        <th className="px-6 py-4">Amount</th>
                        <th className="px-6 py-4 text-right">Actions</th>
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
                              <Badge variant="secondary" className="bg-gray-100 text-gray-700 hover:bg-gray-200 border-0 font-normal">
                                {exp.category}
                              </Badge>
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

        {/* Add/Edit Expense Modal */}
        <Dialog open={isAddExpenseOpen} onOpenChange={setIsAddExpenseOpen}>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle>{editingExpense ? "Edit Expense" : "Log New Expense"}</DialogTitle>
              <DialogDescription>
                {editingExpense ? "Update the details of this transaction." : "Enter the details of the new business expense."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  name="description"
                  placeholder="e.g. Printer Paper, Annual Party"
                  value={form.description}
                  onChange={handleChange}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (₹)</Label>
                  <Input
                    id="amount"
                    name="amount"
                    type="number"
                    placeholder="0.00"
                    value={form.amount}
                    onChange={handleChange}
                    min="0"
                  />
                </div>
              </div>

              <div className="bg-blue-50 p-3 rounded-md flex gap-2 items-start text-xs text-blue-700">
                <Calendar className="h-4 w-4 mt-0.5 shrink-0" />
                <span>
                  {(() => {
                    const now = new Date();
                    const isCurrentMonth = parseInt(selectedMonth) === now.getMonth() && parseInt(selectedYear) === now.getFullYear();
                    const effectiveDay = isCurrentMonth ? now.getDate() : 1;
                    const effectiveDate = new Date(parseInt(selectedYear), parseInt(selectedMonth), effectiveDay);
                    return <>This expense will be recorded for <strong>{format(effectiveDate, "MMMM d, yyyy")}</strong>.</>;
                  })()}
                </span>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddExpenseOpen(false)}>Cancel</Button>
              <Button onClick={handleAddExpense} className="bg-purple-600 hover:bg-purple-700">
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
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="overall">Overall Budget</TabsTrigger>
                <TabsTrigger value="categories">Category Budgets</TabsTrigger>
              </TabsList>
              <TabsContent value="overall" className="space-y-6 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="budget" className="text-sm font-medium">Monthly Budget Amount (₹)</Label>
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
              </TabsContent>
              <TabsContent value="categories" className="space-y-6 pt-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Category</Label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full border rounded-md px-3 py-2 h-10 text-sm"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                {/* Show budget and utilization for selected category */}
                {(() => {
                  const catBudget = categoryBudgets.find(cb => cb.category === selectedCategory)?.amount || 0;
                  const catExpense = expenses.filter((exp: Expense) => exp.category === selectedCategory).reduce((sum: number, exp: Expense) => sum + exp.amount, 0);
                  const catUtilization = catBudget > 0 ? (catExpense / catBudget) * 100 : 0;
                  return (
                    <div className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">{selectedCategory} Budget (₹)</Label>
                        <Input
                          type="number"
                          value={catBudget}
                          min="0"
                          step="100"
                          onChange={e => handleCategoryBudgetUpdate(selectedCategory, e.target.value)}
                          className="h-10"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">Utilization</span>
                          <span className="text-sm font-medium">{catUtilization.toFixed(1)}%</span>
                        </div>
                        <Progress value={catUtilization} className="h-2" />
                        <div className="text-xs text-gray-500">Spent: ₹{catExpense.toLocaleString()} / ₹{catBudget.toLocaleString()}</div>
                      </div>
                    </div>
                  );
                })()}
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}

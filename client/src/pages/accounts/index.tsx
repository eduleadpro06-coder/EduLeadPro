
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, FileText, CheckSquare, PieChart } from "lucide-react";
import StatementUpload from "./components/StatementUpload";
import TransactionReview from "./components/TransactionReview";
import AccountingReports from "./components/AccountingReports";
import AccountingDashboard from "./components/AccountingDashboard";
import Header from "@/components/layout/header";

export default function AccountsPage() {
    const [activeTab, setActiveTab] = useState("dashboard");

    return (
        <div className="min-h-screen app-bg-gradient transition-all duration-300">
            <Header
                title="Accounting & Finance"
                subtitle="Manage bank statements, transactions, and financial reports"
            />

            <div className="px-6 pt-6">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b">
                    {/* Tab Navigation */}
                    <div className="flex gap-2 -mb-px w-full">
                        <Button
                            variant={activeTab === "dashboard" ? "default" : "ghost"}
                            onClick={() => setActiveTab("dashboard")}
                            className="rounded-b-none flex-1"
                        >
                            <PieChart className="h-4 w-4 mr-2" />
                            Dashboard
                        </Button>
                        <Button
                            variant={activeTab === "upload" ? "default" : "ghost"}
                            onClick={() => setActiveTab("upload")}
                            className="rounded-b-none flex-1"
                        >
                            <Upload className="h-4 w-4 mr-2" />
                            Uploads
                        </Button>
                        <Button
                            variant={activeTab === "review" ? "default" : "ghost"}
                            onClick={() => setActiveTab("review")}
                            className="rounded-b-none flex-1"
                        >
                            <CheckSquare className="h-4 w-4 mr-2" />
                            Review
                        </Button>
                        <Button
                            variant={activeTab === "reports" ? "default" : "ghost"}
                            onClick={() => setActiveTab("reports")}
                            className="rounded-b-none flex-1"
                        >
                            <FileText className="h-4 w-4 mr-2" />
                            Reports
                        </Button>
                    </div>
                </div>
            </div>

            {/* Dashboard Tab */}
            {activeTab === "dashboard" && (
                <div className="space-y-6 px-6 py-6">
                    <div className="flex justify-end">
                        <Button onClick={() => setActiveTab("upload")} className="bg-purple-600 hover:bg-purple-700">
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Statement
                        </Button>
                    </div>
                    <AccountingDashboard />
                </div>
            )}

            {/* Uploads Tab */}
            {activeTab === "upload" && (
                <div className="space-y-6 px-6 py-6">
                    <StatementUpload onUploadSuccess={() => setActiveTab("review")} />
                </div>
            )}

            {/* Review Tab */}
            {activeTab === "review" && (
                <div className="space-y-6 px-6 py-6">
                    <TransactionReview />
                </div>
            )}

            {/* Reports Tab */}
            {activeTab === "reports" && (
                <div className="space-y-6 px-6 py-6">
                    <AccountingReports />
                </div>
            )}
        </div>
    );
}

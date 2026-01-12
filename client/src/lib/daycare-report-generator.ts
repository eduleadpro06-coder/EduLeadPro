
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

export interface AttendanceRecord {
    attendanceDate: string;
    checkInTime: string;
    checkOutTime: string | null;
    durationMinutes: number | null;
    status: string;
    notes?: string;
}

export interface DaycareReportData {
    childName: string;
    parentName: string;
    month: string;
    year: number;
    totalDays: number;
    totalHours: string;
    attendances: AttendanceRecord[];
    organization: {
        name: string;
        address: string;
        phone: string;
    };
}

export const generateDaycareAttendancePDF = (data: DaycareReportData) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const margin = 15;

    // Colors
    const primaryColor: [number, number, number] = [107, 191, 89]; // Melons Green
    const secondaryColor: [number, number, number] = [70, 70, 70];
    const lightGray: [number, number, number] = [240, 240, 240];

    // Header - Organization
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(...primaryColor);
    doc.text(data.organization.name.toUpperCase(), pageWidth / 2, 20, { align: "center" });

    doc.setFontSize(10);
    doc.setTextColor(...secondaryColor);
    doc.setFont("helvetica", "normal");
    doc.text(data.organization.address, pageWidth / 2, 27, { align: "center" });
    doc.text(`Phone: ${data.organization.phone}`, pageWidth / 2, 33, { align: "center" });

    // Divider
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.5);
    doc.line(margin, 40, pageWidth - margin, 40);

    // Report Title
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("DAYCARE ATTENDANCE REPORT", margin, 52);

    // Summary Info
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    const summaryY = 62;
    doc.text(`Student Name:`, margin, summaryY);
    doc.setFont("helvetica", "bold");
    doc.text(data.childName, margin + 30, summaryY);

    doc.setFont("helvetica", "normal");
    doc.text(`Parent Name:`, margin, summaryY + 6);
    doc.setFont("helvetica", "bold");
    doc.text(data.parentName, margin + 30, summaryY + 6);

    const rightColX = pageWidth / 2 + 10;
    doc.setFont("helvetica", "normal");
    doc.text(`Report Period:`, rightColX, summaryY);
    doc.setFont("helvetica", "bold");
    doc.text(`${data.month} ${data.year}`, rightColX + 30, summaryY);

    doc.setFont("helvetica", "normal");
    doc.text(`Total Days:`, rightColX, summaryY + 6);
    doc.setFont("helvetica", "bold");
    doc.text(`${data.totalDays}`, rightColX + 30, summaryY + 6);

    doc.setFont("helvetica", "normal");
    doc.text(`Total Hours:`, rightColX, summaryY + 12);
    doc.setFont("helvetica", "bold");
    doc.text(`${data.totalHours} hrs`, rightColX + 30, summaryY + 12);

    // Attendance Table
    const tableData = data.attendances.map(att => [
        format(new Date(att.attendanceDate), "dd MMM yyyy"),
        format(new Date(att.checkInTime), "hh:mm a"),
        att.checkOutTime ? format(new Date(att.checkOutTime), "hh:mm a") : "Active",
        att.durationMinutes ? `${(att.durationMinutes / 60).toFixed(2)} hrs` : "-",
        (att.status || "Recorded").charAt(0).toUpperCase() + (att.status || "Recorded").slice(1)
    ]);

    autoTable(doc, {
        startY: 85,
        head: [['Date', 'Check-In', 'Check-Out', 'Duration', 'Status']],
        body: tableData,
        theme: 'striped',
        headStyles: {
            fillColor: primaryColor,
            textColor: [255, 255, 255],
            fontStyle: 'bold'
        },
        columnStyles: {
            0: { cellWidth: 35 },
            1: { cellWidth: 35 },
            2: { cellWidth: 35 },
            3: { cellWidth: 35 },
            4: { cellWidth: 30 }
        },
        alternateRowStyles: {
            fillColor: lightGray
        }
    });

    // Footer
    const finalY = (doc as any).lastAutoTable.finalY + 20;
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(100, 100, 100);
    doc.text(`This is an automatically generated report from ${data.organization.name} Management Module.`, pageWidth / 2, finalY, { align: "center" });
    doc.text(`Generated on: ${format(new Date(), "dd MMM yyyy, hh:mm a")}`, pageWidth / 2, finalY + 5, { align: "center" });

    // Save
    doc.save(`Daycare_Report_${data.childName.replace(/\s+/g, '_')}_${data.month}_${data.year}.pdf`);
};

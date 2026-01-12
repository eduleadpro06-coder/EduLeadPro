
import jsPDF from "jspdf";
import { format } from "date-fns";

export interface DaycareReceiptData {
    receiptNumber: string;
    paymentDate: string;
    childName: string;
    amount: string;
    paymentMode: string;
    transactionId?: string;
    collectedBy?: string;
    organization: {
        name: string;
        address: string;
        phone: string;
    };
}

function drawReceipt(
    doc: jsPDF,
    y: number,
    data: DaycareReceiptData,
    copyLabel: "PARENT COPY" | "OFFICE COPY"
) {
    const primaryColor: [number, number, number] = [147, 51, 234]; // Purple-600 to differentiate from regular fees (Green)
    const lightBg: [number, number, number] = [250, 245, 255]; // Light purple bg

    // Border and Background
    doc.setFillColor(...lightBg);
    doc.roundedRect(10, y + 10, 190, 135, 3, 3, "F");
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.5);
    doc.roundedRect(10, y + 10, 190, 135, 3, 3, "S");

    // Copy Label
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(150, 150, 150);
    doc.text(copyLabel, 195, y + 18, { align: "right" });

    // Header - Organization
    doc.setFontSize(18);
    doc.setTextColor(...primaryColor);
    doc.text(data.organization.name.toUpperCase(), 105, y + 30, { align: "center" });

    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.setFont("helvetica", "normal");
    doc.text(data.organization.address, 105, y + 36, { align: "center" });
    doc.text(`Contact: ${data.organization.phone}`, 105, y + 41, { align: "center" });

    // Receipt Title
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(50, 50, 50);
    doc.text("DAYCARE PAYMENT RECEIPT", 105, y + 55, { align: "center" });

    // Dotted line
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.2);
    (doc as any).setLineDash([1, 1], 0);
    doc.line(20, y + 60, 190, y + 60);
    (doc as any).setLineDash([], 0);

    // Details Grid
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);

    const leftX = 25;
    const rightX = 115;
    const rowHeight = 10;
    let currentY = y + 72;

    // Row 1
    doc.text("Receipt No:", leftX, currentY);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text(data.receiptNumber, leftX + 35, currentY);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text("Date:", rightX, currentY);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text(format(new Date(data.paymentDate), "dd MMM yyyy"), rightX + 35, currentY);

    // Row 2
    currentY += rowHeight;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text("Child Name:", leftX, currentY);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text(data.childName, leftX + 35, currentY);

    // Row 3
    currentY += rowHeight;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text("Payment Mode:", leftX, currentY);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text(data.paymentMode, leftX + 35, currentY);

    if (data.transactionId) {
        doc.setFont("helvetica", "normal");
        doc.setTextColor(80, 80, 80);
        doc.text("Txn ID:", rightX, currentY);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 0, 0);
        doc.text(data.transactionId, rightX + 35, currentY);
    }

    // Amount Box
    currentY += rowHeight + 5;
    doc.setFillColor(...primaryColor);
    doc.roundedRect(20, currentY, 170, 15, 2, 2, "F");

    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.text("Amount Received:", 30, currentY + 10);
    doc.text(`₹ ${parseFloat(data.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 180, currentY + 10, { align: "right" });

    // Signature Area
    const sigY = y + 135;
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.setFont("helvetica", "normal");
    doc.text("Authorized Signatory", 185, sigY, { align: "right" });

    doc.setFontSize(7);
    doc.text(`This is an automatically generated receipt from ${data.organization.name}.`, 105, y + 142, { align: "center" });
}

export const generateDaycareReceiptPDF = (data: DaycareReceiptData) => {
    const doc = new jsPDF("p", "mm", "a4");

    // Parent Copy
    drawReceipt(doc, 0, data, "PARENT COPY");

    // Divider
    doc.setDrawColor(200, 200, 200);
    (doc as any).setLineDash([2, 1], 0);
    doc.line(0, 148.5, 210, 148.5);
    (doc as any).setLineDash([], 0);

    // Office Copy
    drawReceipt(doc, 148.5, data, "OFFICE COPY");

    doc.save(`Daycare_Receipt_${data.receiptNumber}.pdf`);
};

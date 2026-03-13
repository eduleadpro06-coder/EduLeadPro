
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { formatDateIST } from "./utils";

interface InvoiceData {
    student: {
        id?: number;
        name: string;
        studentId: string;
        class: string;
        parentName?: string;
        address?: string;
        email?: string;
        phone?: string;
    };
    organization: {
        name: string;
        address: string;
        email: string;
        phone: string;
    };
    emiPlan?: {
        totalAmount: string;
        numberOfInstallments: number;
        installmentAmount: string;
        startDate: string;
        endDate: string;
        status: string;
        discount?: string;
    };
    emiSchedule: Array<{
        installmentNumber: number;
        amount: string;
        dueDate: string;
        status: string;
    }>;
    payments: Array<{
        amount: string;
        paymentDate: string;
        paymentMode: string;
        receiptNumber?: string;
        installmentNumber?: number;
        status: string;
    }>;
    feeStructure: Array<{
        feeType: string;
        amount: string;
    }>;
}

export const generateInvoicePDF = (invoiceData: InvoiceData) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 10;

    // Orange/Gold color scheme from the uploaded design
    const orangeR = 245, orangeG = 166, orangeB = 35; // #F5A623
    const darkTextR = 40, darkTextG = 40, darkTextB = 40;
    const lightGrayR = 200, lightGrayG = 200, lightGrayB = 200;

    // Invoice Number format: INV-{YYYY}-{StudentID}
    const studentIdStr = invoiceData.student.studentId || invoiceData.student.id?.toString() || '0088';
    const invoiceNo = `INV-${new Date().getFullYear()}-${studentIdStr.padStart(4, '0')}`;
    const invoiceDate = formatDateIST(new Date());

    // Helper function to format currency with Indian comma style
    const formatCurrency = (amount: number): string => {
        const [integerPart, decimalPart] = amount.toFixed(2).split('.');
        // Indian number system: Add comma after every 2 digits from right, except first 3
        const lastThree = integerPart.slice(-3);
        const otherNumbers = integerPart.slice(0, -3);
        const formatted = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + (otherNumbers ? ',' : '') + lastThree;
        return `${formatted}.${decimalPart}`;
    };

    // ========== PAGE BORDER (Orange/Yellow) ==========
    doc.setDrawColor(orangeR, orangeG, orangeB);
    doc.setLineWidth(2);
    doc.rect(5, 5, pageWidth - 10, pageHeight - 10);

    let yPosition = margin + 10;

    // ========== ORGANIZATION NAME HEADER ==========
    doc.setFontSize(22);
    doc.setFont("times", "bold");
    doc.setTextColor(100, 58, 229); // Brand Purple #643ae5
    doc.text(invoiceData.organization.name, pageWidth / 2, yPosition + 5, { align: "center" });

    yPosition += 15;

    // ========== HEADER SECTION ==========
    // Left box - Invoice details
    doc.setDrawColor(lightGrayR, lightGrayG, lightGrayB);
    doc.setLineWidth(0.5);
    doc.rect(margin, yPosition, 80, 20);

    doc.setFontSize(9);
    doc.setTextColor(darkTextR, darkTextG, darkTextB);
    doc.setFont("helvetica", "normal");
    doc.text(`Invoice #: ${invoiceNo}`, margin + 3, yPosition + 7);
    doc.text(`Invoice Date: ${invoiceDate}`, margin + 3, yPosition + 14);

    // Right side - INVOICE title
    doc.setDrawColor(lightGrayR, lightGrayG, lightGrayB);
    doc.rect(pageWidth - 90, yPosition, 80, 20);

    doc.setFontSize(28);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(orangeR, orangeG, orangeB);
    doc.text("INVOICE", pageWidth - 50, yPosition + 14, { align: "center" });

    yPosition += 25;

    // ========== ORANGE DIVIDER BAR 1 ==========
    doc.setFillColor(orangeR, orangeG, orangeB);
    doc.rect(margin, yPosition, pageWidth - (2 * margin), 4, 'F');

    yPosition += 10;

    // ========== BILL FROM / BILL TO SECTION ==========
    const billingSectionHeight = 50;
    const halfWidth = (pageWidth - (2 * margin)) / 2;

    // Outer box
    doc.setDrawColor(lightGrayR, lightGrayG, lightGrayB);
    doc.setLineWidth(0.5);
    doc.rect(margin, yPosition, pageWidth - (2 * margin), billingSectionHeight);

    // Vertical divider
    doc.line(margin + halfWidth, yPosition, margin + halfWidth, yPosition + billingSectionHeight);

    doc.setFontSize(10);
    doc.setTextColor(darkTextR, darkTextG, darkTextB);

    // LEFT SIDE - Bill From
    const leftX = margin + 5;
    let leftY = yPosition + 8;

    doc.setFont("helvetica", "bold");
    doc.text("Bill From:", leftX, leftY);
    doc.setFont("helvetica", "normal");

    leftY += 6;
    doc.text(invoiceData.organization.name, leftX, leftY);

    leftY += 5;
    const orgAddressLines = doc.splitTextToSize(invoiceData.organization.address, halfWidth - 15);
    doc.text(orgAddressLines, leftX, leftY);
    leftY += orgAddressLines.length * 5;

    doc.text(`Email: ${invoiceData.organization.email}`, leftX, leftY);
    leftY += 5;
    doc.text(`Phone: ${invoiceData.organization.phone}`, leftX, leftY);

    // RIGHT SIDE - Bill To
    const rightX = margin + halfWidth + 5;
    let rightY = yPosition + 8;

    doc.setFont("helvetica", "bold");
    doc.text("Bill to:", rightX, rightY);
    doc.setFont("helvetica", "normal");

    rightY += 6;
    doc.text(`Parent Name: ${invoiceData.student.parentName || 'N/A'}`, rightX, rightY);

    rightY += 5;
    doc.text(`Student Name: ${invoiceData.student.name}`, rightX, rightY);

    rightY += 5;
    if (invoiceData.student.address) {
        const studentAddressLines = doc.splitTextToSize(invoiceData.student.address, halfWidth - 15);
        doc.text(studentAddressLines, rightX, rightY);
        rightY += studentAddressLines.length * 5;
    }

    if (invoiceData.student.email) {
        doc.text(`Email: ${invoiceData.student.email}`, rightX, rightY);
        rightY += 5;
    }
    if (invoiceData.student.phone) {
        doc.text(`Phone: ${invoiceData.student.phone}`, rightX, rightY);
    }

    yPosition += billingSectionHeight + 10;

    // ========== ORANGE DIVIDER BAR 2 ==========
    doc.setFillColor(orangeR, orangeG, orangeB);
    doc.rect(margin, yPosition, pageWidth - (2 * margin), 4, 'F');

    yPosition += 10;

    // ========== SERVICE/ITEM TABLE ==========
    const tableBody: string[][] = [];

    if (invoiceData.emiPlan) {
        // Show the base Course Fee minus any discount to form the true "Subtotal" on the invoice,
        // but wait, let's just show the raw Course Fee as the first item.
        const totalFee = parseFloat(invoiceData.emiPlan.totalAmount);
        tableBody.push([
            `Course Fee: ${invoiceData.student.class || 'Program'}`,
            `Rs. ${formatCurrency(totalFee)}`
        ]);

        // Add all installments as separate line items for reference (showing how it is split)
        // Sort by installment number to be safe
        const allInstallments = [...invoiceData.emiSchedule].sort((a, b) => a.installmentNumber - b.installmentNumber);
        allInstallments.forEach(inst => {
            const statusText = inst.status === 'paid' ? ' (Paid)' : ` (Due ${format(new Date(inst.dueDate), "MMM dd, yyyy")})`;
            tableBody.push([
                `Installment #${inst.installmentNumber}${statusText}`,
                `Rs. ${formatCurrency(parseFloat(inst.amount))}`
            ]);
        });
    } else {
        // Flat fees
        invoiceData.feeStructure.forEach(fee => {
            tableBody.push([
                fee.feeType,
                `Rs. ${formatCurrency(parseFloat(fee.amount))}`
            ]);
        });
    }

    autoTable(doc, {
        startY: yPosition,
        head: [['Service/Item', 'Amount']],
        body: tableBody,
        theme: 'plain',
        headStyles: {
            fillColor: [255, 255, 255],
            textColor: [darkTextR, darkTextG, darkTextB],
            fontStyle: 'bold',
            fontSize: 11,
            cellPadding: 5,
            lineWidth: { top: 1, right: 1, bottom: 1, left: 1 },
            lineColor: [orangeR, orangeG, orangeB]
        },
        bodyStyles: {
            fontSize: 10,
            textColor: [darkTextR, darkTextG, darkTextB],
            cellPadding: 5,
            lineWidth: { top: 0.5, right: 1, bottom: 0.5, left: 1 },
            lineColor: [orangeR, orangeG, orangeB]
        },
        columnStyles: {
            0: { cellWidth: 'auto', halign: 'left' },
            1: { cellWidth: 50, halign: 'right' }
        },
        margin: { left: margin, right: margin },
        didParseCell: (hookData) => {
            if (hookData.section === 'body') {
                // Course Fee row (first row)
                if (hookData.row.index === 0) {
                    hookData.cell.styles.fontStyle = 'bold';
                    hookData.cell.styles.fillColor = [255, 248, 230]; // Light orange/yellow
                } else if (invoiceData.emiPlan) {
                    // Installment rows
                    hookData.cell.styles.textColor = [100, 100, 100];
                    hookData.cell.styles.fontStyle = 'italic';
                    hookData.cell.styles.fontSize = 9;
                    if (hookData.column.index === 0) {
                        // Indent the installment text natively
                        hookData.cell.text[0] = `  • ${hookData.cell.text[0]}`;
                    }
                }
            }
        },
        didDrawCell: (hookData) => {
            if (hookData.section === 'body') {
                const cell = hookData.cell;
                // Redraw borders since fillColor might cover them
                doc.setDrawColor(orangeR, orangeG, orangeB);
                doc.setLineWidth(0.5);
                doc.rect(cell.x, cell.y, cell.width, cell.height);
            }
        }
    });

    // @ts-ignore - accessing jsPDF autoTable property
    yPosition = doc.lastAutoTable.finalY + 10;

    // ========== TOTALS SECTION (Right aligned) ==========
    const totalAmount = invoiceData.emiPlan
        ? parseFloat(invoiceData.emiPlan.totalAmount)
        : invoiceData.feeStructure.reduce((s, f) => s + parseFloat(f.amount), 0);
    const discount = invoiceData.emiPlan ? parseFloat(invoiceData.emiPlan.discount || "0") : 0;

    // Subtotal is the gross total amount (before discount)
    const subtotal = totalAmount + discount;
    const total = totalAmount;

    const totalsBoxWidth = 90;
    // Dynamic height: base 26 (Subtotal + Total), add 7 if discount > 0
    const totalsBoxHeight = discount > 0 ? 33 : 26;
    const totalsX = pageWidth - margin - totalsBoxWidth;

    // Draw totals box
    doc.setDrawColor(lightGrayR, lightGrayG, lightGrayB);
    doc.setLineWidth(0.5);
    doc.rect(totalsX, yPosition, totalsBoxWidth, totalsBoxHeight);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(darkTextR, darkTextG, darkTextB);

    let totalY = yPosition + 7;
    const lineSpacing = 7;

    // Subtotal
    doc.text("Subtotal:", totalsX + 5, totalY);
    doc.text(`Rs. ${formatCurrency(subtotal)}`,
        totalsX + totalsBoxWidth - 5, totalY, { align: "right" });

    // Discount (only show if discount > 0)
    if (discount > 0) {
        totalY += lineSpacing;
        doc.text("Discount:", totalsX + 5, totalY);
        doc.text(`Rs. ${formatCurrency(discount)}`,
            totalsX + totalsBoxWidth - 5, totalY, { align: "right" });
    }

    // Total (Bold)
    totalY += lineSpacing;
    doc.setFont("helvetica", "bold");
    doc.text("Total:", totalsX + 5, totalY);
    doc.text(`Rs. ${formatCurrency(total)}`,
        totalsX + totalsBoxWidth - 5, totalY, { align: "right" });

    yPosition += totalsBoxHeight + 2;

    // ========== ORANGE DIVIDER BAR 3 (Bottom) ==========
    // Position right after the totals box
    doc.setFillColor(orangeR, orangeG, orangeB);
    doc.rect(margin, yPosition, pageWidth - (2 * margin), 4, 'F');

    yPosition += 4; // Move past the orange bar

    // Calculate position for Notes and Signature - use remaining space
    const remainingSpace = pageHeight - yPosition - 10; // 10 for bottom margin
    const notesSignatureY = yPosition + (remainingSpace * 0.7); // Position at 70% of remaining space to move it closer to bottom

    // ========== NOTES SECTION (Left Side) ==========
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(darkTextR, darkTextG, darkTextB);
    doc.text("Notes", margin, notesSignatureY);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    // Constrain text width to prevent overlap with signature section (use ~60% of page width)
    const notesMaxWidth = (pageWidth - (2 * margin)) * 0.6;
    const notesText = doc.splitTextToSize(
        "Payment is due by the date specified above. Late payments may be subject to a fine.",
        notesMaxWidth
    );
    doc.text(notesText, margin, notesSignatureY + 6);

    // ========== SIGNATURE AREA (Right Side - Same Baseline as Notes) ==========
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(darkTextR, darkTextG, darkTextB);

    const signatureX = pageWidth - 65;
    doc.text("Authorized Signatory", signatureX, notesSignatureY, { align: "center" });
    doc.setFontSize(9);
    doc.text("(School Stamp & Sign)", signatureX, notesSignatureY + 6, { align: "center" });

    // Save the PDF
    doc.save(`Invoice_${invoiceNo}_${invoiceData.student.name.replace(/\s+/g, "_")}.pdf`);
};

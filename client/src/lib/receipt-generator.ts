import jsPDF from "jspdf";

/* ============================
   TYPES
============================ */

export interface FeeReceiptData {
    studentName: string;
    className: string;
    paymentMode: string;
    amount: string;
    date: string;
    transactionId?: string; // Optional transaction ID
    organizationName?: string; // Organization name
    organizationPhone?: string; // Organization phone
    organizationAddress?: string; // Organization address
    academicYear?: string; // Academic Year
}

/* ============================
   AUTO RECEIPT NUMBER
   (Use DB in production)
============================ */

/* ============================
   AUTO RECEIPT NUMBER
   (Use DB in production)
============================ */

export function generateReceiptNo(academicYear: string = "2026-27"): string {
    let counter = Number(localStorage.getItem("fee_receipt_no")) || 0;
    counter++;

    localStorage.setItem("fee_receipt_no", counter.toString());

    return `REC/${academicYear}/${String(counter).padStart(6, "0")}`;
}

/* ============================
   DRAW SINGLE HALF RECEIPT
============================ */

function drawReceipt(
    doc: jsPDF,
    y: number,
    receiptNo: string,
    data: FeeReceiptData,
    copyLabel: "PARENT COPY" | "OFFICE COPY"
) {
    // Brand colors (Green theme as seen in screenshot)
    const brandColor: [number, number, number] = [0, 100, 0];
    const lightBg: [number, number, number] = [240, 255, 240];

    // Card background - standardized margins
    doc.setFillColor(...lightBg);
    doc.roundedRect(12, y + 8, 186, 138, 5, 5, "F");

    doc.setDrawColor(...brandColor);
    doc.roundedRect(12, y + 8, 186, 138, 5, 5);

    // Copy label
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(copyLabel, 192, y + 15, { align: "right" });

    // Header
    doc.setFontSize(14);
    doc.text(data.organizationName || "Bloomdale Preschool & Daycare", 105, y + 26, { align: "center" });

    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("STUDENT FEE RECEIPT", 105, y + 42, { align: "center" });

    // Info row
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Receipt No: ${receiptNo}`, 18, y + 55);
    doc.text(`Date: ${data.date}`, 192, y + 55, { align: "right" });

    // Student details
    doc.text("Student Name :", 18, y + 68);
    doc.text(data.studentName, 55, y + 68);

    doc.text("Class / Section :", 18, y + 78);
    doc.text(data.className, 55, y + 78);

    doc.text("Payment Mode :", 18, y + 88);
    doc.text(data.paymentMode, 55, y + 88);

    // Transaction ID
    let currentY = y + 88;
    if (data.transactionId) {
        currentY += 10;
        doc.text("Transaction ID :", 18, currentY);
        doc.text(data.transactionId, 55, currentY);
    }

    // Amount highlight - centered white box
    const amountY = currentY + 12;
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(18, amountY, 174, 16, 4, 4, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Amount Paid", 24, amountY + 10.5);

    // Format amount with commas and 2 decimals
    const formattedAmount = Number(data.amount || 0).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    doc.text(`Rs. ${formattedAmount}`, 190, amountY + 10.5, { align: "right" });

    // Footer
    const footerY = amountY + 22;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(`Academic Year: ${data.academicYear || "2026-27"}`, 18, footerY);

    // Dynamic Footer Address
    const orgName = data.organizationName || "Bloomdale Preschool & Daycare";
    const address = data.organizationAddress || "";
    const phone = data.organizationPhone || "";

    const footerAddress = `${orgName}${address ? `, ${address}` : ""}${phone ? ` | Ph: ${phone}` : ""}`;

    doc.setFontSize(7);
    const maxWidth = 165;
    const addressLines = doc.splitTextToSize(footerAddress, maxWidth);
    const addressStartY = footerY + 2; // Closer to academic year

    addressLines.forEach((line: string, i: number) => {
        doc.text(line, 105, addressStartY + (i * 3.5), { align: "center" });
    });

    const afterAddressY = addressStartY + (addressLines.length * 3.5);

    doc.setFontSize(7.5);
    doc.setTextColor(100, 100, 100);
    doc.text(
        "This is a computer-generated receipt and does not require a signature.",
        105,
        afterAddressY + 2,
        { align: "center" }
    );
    doc.setTextColor(0, 0, 0);

    doc.setFontSize(8);
    doc.text("Authorized Signatory", 192, afterAddressY + 7, { align: "right" });
}


/* ============================
   RECEIPT OPTIONS
============================ */

export interface ReceiptOptions {
    /** 'download' saves a PDF file; 'print' opens browser print dialog */
    mode?: 'download' | 'print';
    /** 'parent' = parent copy only; 'both' = parent + office copy */
    copyType?: 'parent' | 'both';
}

/* ============================
   MAIN FUNCTION
============================ */

/**
 * Generate PDF Receipt
 * @param data Receipt details
 * @param existingReceiptNo Optional receipt number
 * @param options Controls download vs print and copy type
 */
export function generateFeeReceipt(
    data: FeeReceiptData,
    existingReceiptNo?: string,
    options?: ReceiptOptions
): void {
    const mode = options?.mode ?? 'download';
    const copyType = options?.copyType ?? (mode === 'print' ? 'both' : 'parent');

    const doc = new jsPDF("p", "mm", "a4");;

    const receiptNo = existingReceiptNo || generateReceiptNo(data.academicYear);

    // Parent copy (Top)
    drawReceipt(doc, 0, receiptNo, data, "PARENT COPY");

    if (copyType === 'both') {
        // Dotted cut line
        (doc as any).setLineDash([3, 3], 0);
        doc.setDrawColor(160);
        doc.line(10, 148, 200, 148);

        // Office copy (Bottom)
        drawReceipt(doc, 148, receiptNo, data, "OFFICE COPY");
    }

    if (mode === 'print') {
        // Use a hidden iframe to trigger print in the same tab
        const pdfBlob = doc.output('blob');
        const blobUrl = URL.createObjectURL(pdfBlob);

        // Remove any existing print iframe
        const existingFrame = document.getElementById('receipt-print-frame');
        if (existingFrame) existingFrame.remove();

        const iframe = document.createElement('iframe');
        iframe.id = 'receipt-print-frame';
        iframe.style.position = 'fixed';
        iframe.style.top = '-10000px';
        iframe.style.left = '-10000px';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = 'none';
        iframe.src = blobUrl;

        iframe.onload = () => {
            try {
                iframe.contentWindow?.focus();
                iframe.contentWindow?.print();
            } catch (_) {
                // Fallback: open in new tab if iframe print fails
                window.open(blobUrl, '_blank');
            }
            // Clean up after a delay to allow print dialog to appear
            setTimeout(() => {
                URL.revokeObjectURL(blobUrl);
                iframe.remove();
            }, 60000);
        };

        document.body.appendChild(iframe);
    } else {

        // Download mode
        doc.save(`Fee_Receipt_${receiptNo.replace(/\//g, "-")}.pdf`);
    }
}


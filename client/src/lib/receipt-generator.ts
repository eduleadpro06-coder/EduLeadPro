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

export function generateReceiptNo(academicYear: string = "2025-26"): string {
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
    // Brand colors (Generic Green or pass as prop)
    const brandColor: [number, number, number] = [0, 100, 0]; // Dark Green generic
    const lightBg: [number, number, number] = [240, 255, 240]; // Light mint green


    // Card background
    doc.setFillColor(...lightBg);
    doc.roundedRect(10, y + 10, 190, 135, 5, 5, "F");

    doc.setDrawColor(...brandColor);
    doc.roundedRect(10, y + 10, 190, 135, 5, 5);

    // Copy label
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(copyLabel, 195, y + 18, { align: "right" });

    // Header
    doc.setFontSize(15);
    doc.text(data.organizationName || "Organization Name", 105, y + 30, { align: "center" });

    // Optional Tagline or spacer
    // doc.setFontSize(9);
    // doc.setFont("helvetica", "normal");
    // doc.text("Education Management", 105, y + 36, { align: "center" }); 

    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("STUDENT FEE RECEIPT", 105, y + 50, { align: "center" });

    // Info row
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Receipt No: ${receiptNo}`, 15, y + 62);
    doc.text(`Date: ${data.date}`, 190, y + 62, { align: "right" });

    // Student details
    doc.text("Student Name :", 15, y + 75);
    doc.text(data.studentName, 55, y + 75);

    doc.text("Class / Section :", 15, y + 85);
    doc.text(data.className, 55, y + 85);

    doc.text("Payment Mode :", 15, y + 95);
    doc.text(data.paymentMode, 55, y + 95);

    // Transaction ID
    if (data.transactionId) {
        doc.text("Transaction ID :", 15, y + 105);
        doc.text(data.transactionId, 55, y + 105);
    }

    // Amount highlight
    const amountY = data.transactionId ? y + 113 : y + 103;
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(15, amountY, 180, 18, 4, 4, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Amount Paid", 20, amountY + 12);
    doc.text(`Rs. ${data.amount}`, 185, amountY + 12, { align: "right" });

    // Footer
    const footerY = data.transactionId ? y + 136 : y + 126;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(`Academic Year: ${data.academicYear || "2025-26"}`, 15, footerY);

    // Dynamic Footer Address
    const footerAddress = data.organizationAddress
        ? `${data.organizationName || "Organization"}, ${data.organizationAddress} | Ph: ${data.organizationPhone || "N/A"}`
        : "Authorized Signatory";

    doc.text(
        footerAddress,
        105,
        y + 132,
        { align: "center" }
    );

    doc.text(
        "This is a computer-generated receipt and does not require a signature.",
        105,
        y + 138,
        { align: "center" }
    );

    doc.text("Authorized Signatory", 185, y + 144, { align: "right" });
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

    const doc = new jsPDF("p", "mm", "a4");
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


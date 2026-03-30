/**
 * Fee Receipt Generator for Mobile
 * Uses expo-print to generate HTML-based PDF receipts
 * Matches exact format from web app's receipt-generator.ts
 */

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';

export interface FeeReceiptData {
    studentName: string;
    className: string;
    paymentMode: string;
    amount: string;
    date: string;
    transactionId?: string;
    organizationName?: string;
    organizationPhone?: string;
    organizationAddress?: string;
    academicYear?: string;
    receiptNumber?: string;
}

/**
 * Build the HTML for a single receipt copy
 */
function buildReceiptCopyHtml(data: FeeReceiptData, copyLabel: string): string {
    const transactionRow = data.transactionId
        ? `<tr>
            <td style="padding: 6px 0; color: #333; font-size: 13px;">Transaction ID :</td>
            <td style="padding: 6px 0; color: #111; font-size: 13px; font-weight: 500;">${data.transactionId}</td>
           </tr>`
        : '';

    const footerAddress = data.organizationAddress
        ? `${data.organizationName || 'Organization'}, ${data.organizationAddress}${data.organizationPhone ? ' | Ph: ' + data.organizationPhone : ''}`
        : '';

    return `
    <div style="border: 2px solid #006400; border-radius: 10px; background: #f0fff0; padding: 24px 20px 18px 20px; position: relative; margin-bottom: 10px; page-break-inside: avoid;">
        <!-- Copy Label -->
        <div style="position: absolute; top: 10px; right: 16px; font-size: 10px; font-weight: bold; color: #333;">${copyLabel}</div>
        
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 4px;">
            <div style="font-size: 18px; font-weight: bold; color: #111;">${data.organizationName || 'Organization Name'}</div>
        </div>
        
        <!-- Title -->
        <div style="text-align: center; margin: 14px 0 12px 0;">
            <div style="font-size: 15px; font-weight: bold; color: #111;">STUDENT FEE RECEIPT</div>
        </div>
        
        <!-- Receipt Info Row -->
        <div style="display: flex; justify-content: space-between; margin-bottom: 14px; font-size: 12px; color: #333;">
            <span>Receipt No: ${data.receiptNumber || 'N/A'}</span>
            <span>Date: ${data.date}</span>
        </div>
        
        <!-- Student Details Table -->
        <table style="width: 100%; margin-bottom: 14px;">
            <tr>
                <td style="padding: 6px 0; color: #333; font-size: 13px; width: 140px;">Student Name :</td>
                <td style="padding: 6px 0; color: #111; font-size: 13px; font-weight: 500;">${data.studentName}</td>
            </tr>
            <tr>
                <td style="padding: 6px 0; color: #333; font-size: 13px;">Class / Section :</td>
                <td style="padding: 6px 0; color: #111; font-size: 13px; font-weight: 500;">${data.className}</td>
            </tr>
            <tr>
                <td style="padding: 6px 0; color: #333; font-size: 13px;">Payment Mode :</td>
                <td style="padding: 6px 0; color: #111; font-size: 13px; font-weight: 500;">${data.paymentMode}</td>
            </tr>
            ${transactionRow}
        </table>
        
        <!-- Amount Highlight -->
        <div style="background: #fff; border-radius: 8px; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
            <span style="font-size: 14px; font-weight: bold; color: #111;">Amount Paid</span>
            <span style="font-size: 14px; font-weight: bold; color: #111;">Rs. ${data.amount}</span>
        </div>
        
        <!-- Footer -->
        <div style="font-size: 10px; color: #333; margin-bottom: 4px;">
            Academic Year: ${data.academicYear || '2026-27'}
        </div>
        ${footerAddress ? `<div style="text-align: center; font-size: 9px; color: #555; margin-bottom: 4px;">${footerAddress}</div>` : ''}
        <div style="text-align: center; font-size: 10px; color: #c80000; margin-bottom: 6px;">
            This is a computer-generated receipt and does not require a signature.
        </div>
        <div style="text-align: right; font-size: 10px; color: #333;">
            Authorized Signatory
        </div>
    </div>
    `;
}

/**
 * Generate fee receipt PDF and open share dialog
 */
export async function generateMobileFeeReceipt(data: FeeReceiptData): Promise<void> {
    const parentCopy = buildReceiptCopyHtml(data, 'PARENT COPY');

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Helvetica, Arial, sans-serif; padding: 20px; background: #fff; }
            @page { margin: 20px; }
        </style>
    </head>
    <body>
        ${parentCopy}
    </body>
    </html>
    `;

    // Generate PDF using expo-print
    const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
    });

    // Build a meaningful filename instead of the random one from expo-print
    const sanitizedName = data.studentName.replace(/[^a-zA-Z0-9]/g, '_');
    const sanitizedReceipt = (data.receiptNumber || 'Receipt').replace(/[^a-zA-Z0-9]/g, '-');
    const fileName = `Fee_Receipt_${sanitizedName}_${sanitizedReceipt}.pdf`;

    // Rename/move the file to the new path with meaningful name using new File API
    let shareUri = uri;
    try {
        const sourceFile = new File(uri);
        const destFile = new File(Paths.cache, fileName);
        sourceFile.move(destFile);
        shareUri = destFile.uri;
    } catch (e) {
        console.warn('Could not rename receipt file, using original:', e);
        // Fall back to original uri if rename fails
    }

    // Share the renamed PDF
    if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(shareUri, {
            mimeType: 'application/pdf',
            dialogTitle: 'Fee Receipt',
            UTI: 'com.adobe.pdf',
        });
    }
}

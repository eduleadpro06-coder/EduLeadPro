
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { parse } from "csv-parse/sync";
import xlsx from "xlsx";
import * as pdfLib from "pdf-parse";
// @ts-ignore
const pdf = pdfLib.default || pdfLib;
import { InsertBankTransaction } from "../../../shared/schema.js";

interface NormalizedRow {
    date: Date;
    description: string;
    amount: number;
    type: "credit" | "debit";
    balance?: number;
    reference?: string;
    raw: any;
}

export class NormalizationEngine {

    async normalizeStatement(
        filePath: string,
        statementId: number,
        organizationId: number
    ): Promise<InsertBankTransaction[]> {

        const ext = path.extname(filePath).toLowerCase();
        let rows: NormalizedRow[] = [];

        if (ext === ".csv") {
            rows = await this.parseCSV(filePath);
        } else if (ext === ".xls" || ext === ".xlsx") {
            rows = await this.parseExcel(filePath);
        } else if (ext === ".pdf") {
            rows = await this.parsePDF(filePath);
        } else {
            throw new Error(`Unsupported file type: ${ext}`);
        }

        return rows.map(row => {
            // Create hash
            const hash = crypto.createHash('sha256')
                .update(JSON.stringify(row.raw) + statementId)
                .digest('hex');

            return {
                organizationId,
                statementId,
                date: row.date.toISOString().split('T')[0], // YYYY-MM-DD
                description: row.description,
                amount: row.amount.toString(),
                type: row.type,
                balance: row.balance?.toString(),
                reference: row.reference,
                status: "pending",
                rowHash: hash,
                confidenceScore: "0",
                classificationReason: "Pending classification"
            };
        });
    }

    private async parseCSV(filePath: string): Promise<NormalizedRow[]> {
        const content = fs.readFileSync(filePath, 'utf-8');
        const records = parse(content, {
            columns: true,
            skip_empty_lines: true,
            trim: true
        });

        if (records.length === 0) return [];

        const headers = Object.keys(records[0] as object);
        const mapping = this.detectColumns(headers);

        return records.map((record: any) => this.mapRecord(record, mapping)).filter((r: any) => r !== null) as NormalizedRow[];
    }

    private async parseExcel(filePath: string): Promise<NormalizedRow[]> {
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const records: any[] = xlsx.utils.sheet_to_json(worksheet, { defval: "" });

        if (records.length === 0) return [];

        const headers = Object.keys(records[0] as object);
        const mapping = this.detectColumns(headers);

        return records.map(record => this.mapRecord(record, mapping)).filter(r => r !== null) as NormalizedRow[];
    }

    private async parsePDF(filePath: string): Promise<NormalizedRow[]> {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdf(dataBuffer);
        const text = data.text;

        const lines = text.split('\n').filter((line: string) => line.trim().length > 0);
        const rows: NormalizedRow[] = [];

        const dateRegex = /(\d{2}[\/\-]\d{2}[\/\-]\d{4})/;
        // Money regex: numbers with commas and decimal
        const moneyRegex = /([\d,]+\.\d{2})/;

        // Basic text parsing stub
        console.warn("PDF parsing is experimental.");
        return [];
    }

    private detectColumns(headers: string[]) {
        const lowerHeaders = headers.map(h => h.toLowerCase());
        const mapping: any = {};

        lowerHeaders.forEach((h, i) => {
            if (h.includes('date') || h.includes('txn date')) mapping.date = headers[i];
            else if (h.includes('description') || h.includes('narrative') || h.includes('particulars')) mapping.description = headers[i];
            else if (h.includes('debit') || h.includes('withdrawal') || h.includes('dr')) mapping.debit = headers[i];
            else if (h.includes('credit') || h.includes('deposit') || h.includes('cr')) mapping.credit = headers[i];
            else if (h.includes('amount')) mapping.amount = headers[i];
            else if (h.includes('balance')) mapping.balance = headers[i];
            else if (h.includes('ref') || h.includes('cheque')) mapping.reference = headers[i];
        });

        return mapping;
    }

    private mapRecord(record: any, mapping: any): NormalizedRow | null {
        try {
            const dateStr = record[mapping.date];
            if (!dateStr) return null;

            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return null;

            const description = record[mapping.description] || "No description";
            let amount = 0;
            let type: "credit" | "debit" = "debit";

            if (mapping.debit && record[mapping.debit]) {
                const val = this.parseAmount(record[mapping.debit]);
                if (val > 0) {
                    amount = val;
                    type = "debit";
                }
            }

            if (mapping.credit && record[mapping.credit]) {
                const val = this.parseAmount(record[mapping.credit]);
                if (val > 0) {
                    amount = val;
                    type = "credit";
                }
            }

            if (mapping.amount && !amount) {
                const val = this.parseAmount(record[mapping.amount]);
                amount = Math.abs(val);
                type = val >= 0 ? "credit" : "debit";
                if (val < 0) type = "debit";
            }

            if (amount === 0) return null;

            return {
                date,
                description,
                amount,
                type,
                balance: mapping.balance ? this.parseAmount(record[mapping.balance]) : undefined,
                reference: mapping.reference ? record[mapping.reference] : undefined,
                raw: record
            };
        } catch (e) {
            return null;
        }
    }

    private parseAmount(val: any): number {
        if (typeof val === 'number') return val;
        if (typeof val === 'string') {
            const clean = val.replace(/[^0-9.\-]/g, '');
            return parseFloat(clean);
        }
        return 0;
    }
}

export const normalizationEngine = new NormalizationEngine();

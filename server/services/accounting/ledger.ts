
import { accountingStorage } from "./storage.js";
import { InsertLedgerEntry, bankTransactions } from "../../../shared/schema.js";
import { eq, and } from "drizzle-orm";
import { db } from "../../db.js";

export class LedgerEngine {

    async postTransaction(transactionId: number, organizationId: number) {
        // 1. Get Transaction
        const transaction = await db.query.bankTransactions.findFirst({
            where: and(
                eq(bankTransactions.id, transactionId),
                eq(bankTransactions.organizationId, organizationId)
            )
        });

        if (!transaction) throw new Error("Transaction not found");
        if (transaction.status === 'posted') throw new Error("Transaction already posted");

        // Check if classified
        if (!transaction.suggestedAccountId) {
            throw new Error("Transaction must be classified before posting");
        }

        // 2. Identify Bank Account (System Account '1010')
        // Optimally we cache this or look it up once.
        const accounts = await accountingStorage.getAccounts(organizationId);
        const bankAccount = accounts.find(a => a.code === '1010' && a.isSystem);

        if (!bankAccount) {
            throw new Error("System Bank Account (Code 1010) not found in Chart of Accounts");
        }

        const targetAccountId = transaction.suggestedAccountId;
        const amount = Number(transaction.amount);
        const date = new Date(transaction.date); // Ensure date object

        const entries: InsertLedgerEntry[] = [];

        // 3. Create Double Entries
        if (transaction.type === 'credit') {
            // Money IN (Deposit)
            // Debit: Bank (Asset Up)
            entries.push({
                organizationId,
                transactionId,
                accountId: bankAccount.id,
                debit: amount.toString(),
                credit: "0",
                description: transaction.description,
                entryDate: date.toISOString().split('T')[0]
            });
            // Credit: Income/Source (Income Up or Liability Up)
            entries.push({
                organizationId,
                transactionId,
                accountId: targetAccountId,
                debit: "0",
                credit: amount.toString(),
                description: transaction.description,
                entryDate: date.toISOString().split('T')[0]
            });
        } else {
            // Money OUT (Withdrawal)
            // Debit: Expense/Target (Expense Up or Liability Down)
            entries.push({
                organizationId,
                transactionId,
                accountId: targetAccountId,
                debit: amount.toString(),
                credit: "0",
                description: transaction.description,
                entryDate: date.toISOString().split('T')[0]
            });
            // Credit: Bank (Asset Down)
            entries.push({
                organizationId,
                transactionId,
                accountId: bankAccount.id,
                debit: "0",
                credit: amount.toString(),
                description: transaction.description,
                entryDate: date.toISOString().split('T')[0]
            });
        }

        // 4. Atomic Transaction: Insert Entries + Update Status
        await db.transaction(async (tx) => {
            // Cannot use accountingStorage directly if I want partial transaction support?
            // But accountingStorage uses 'db'.
            // I'll assume optimistically for now or use `accountingStorage` methods which are single calls.
            // Drizzle transaction requires all ops on `tx` object.
            // To be safe, I should move `createLedgerEntries` logic here or accept tx.
            // For Phase 1, sequential awaits is okay if occasional failure is acceptable (Manual fix).
            // But "Audit Safety" -> Atomic is better.

            // Re-implement insert using tx
            await tx.insert(require("../../../shared/schema.js").ledgerEntries).values(entries);

            await tx.update(bankTransactions)
                .set({ status: 'posted' })
                .where(eq(bankTransactions.id, transactionId));

            // Log Audit
            await tx.insert(require("../../../shared/schema.js").accountingAuditLogs).values({
                organizationId,
                entityType: 'transaction',
                entityId: transactionId,
                action: 'post_ledger',
                changes: { entries: entries.length, amount },
                performedBy: null // System or User ID needs to be passed
            });
        });

        return true;
    }
}

export const ledgerEngine = new LedgerEngine();

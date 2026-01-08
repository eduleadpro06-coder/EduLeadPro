
import { db } from "../../db.js";
import {
    accountMaster,
    bankStatements,
    bankTransactions,
    ledgerEntries,
    classificationRules,
    classificationFeedback,
    accountingAuditLogs,
    InsertAccountMaster,
    InsertBankStatement,
    InsertBankTransaction,
    InsertLedgerEntry,
    InsertClassificationRule,
    InsertClassificationFeedback,
    InsertAccountingAuditLog
} from "../../../shared/schema.js";
import { eq, and, desc, sql } from "drizzle-orm";

export class AccountingStorage {

    // Account Master
    async getAccounts(organizationId: number) {
        return await db.select().from(accountMaster).where(eq(accountMaster.organizationId, organizationId));
    }

    async createAccount(data: InsertAccountMaster) {
        return await db.insert(accountMaster).values(data).returning();
    }

    // Bank Statements
    async createBankStatement(data: InsertBankStatement) {
        return await db.insert(bankStatements).values(data).returning();
    }

    async getBankStatements(organizationId: number) {
        return await db.select().from(bankStatements)
            .where(eq(bankStatements.organizationId, organizationId))
            .orderBy(desc(bankStatements.createdAt));
    }

    async getBankStatement(id: number, organizationId: number) {
        const result = await db.select().from(bankStatements)
            .where(and(eq(bankStatements.id, id), eq(bankStatements.organizationId, organizationId)));
        return result[0];
    }

    async updateBankStatementStatus(id: number, status: string, errorLog?: string) {
        return await db.update(bankStatements)
            .set({ status, errorLog, updatedAt: new Date() })
            .where(eq(bankStatements.id, id))
            .returning();
    }

    // Transactions
    async createTransactions(data: InsertBankTransaction[]) {
        // Drizzle insert many
        return await db.insert(bankTransactions).values(data).returning();
    }

    async getTransactionsByStatement(statementId: number) {
        return await db.select().from(bankTransactions)
            .where(eq(bankTransactions.statementId, statementId));
    }

    async getReviewQueue(organizationId: number) {
        return await db.select({
            transaction: bankTransactions,
            account: accountMaster
        })
            .from(bankTransactions)
            .leftJoin(accountMaster, eq(bankTransactions.suggestedAccountId, accountMaster.id))
            .where(and(
                eq(bankTransactions.organizationId, organizationId),
                eq(bankTransactions.status, 'pending') // or 'classified' but not posted
            ))
            .orderBy(desc(bankTransactions.date));
    }

    async updateTransaction(id: number, updates: Partial<InsertBankTransaction>) {
        return await db.update(bankTransactions).set(updates).where(eq(bankTransactions.id, id)).returning();
    }

    // Ledger
    async createLedgerEntries(entries: InsertLedgerEntry[]) {
        return await db.insert(ledgerEntries).values(entries).returning();
    }

    async getLedgerEntries(organizationId: number, accountId?: number) {
        const conditions = [eq(ledgerEntries.organizationId, organizationId)];
        if (accountId) {
            conditions.push(eq(ledgerEntries.accountId, accountId));
        }
        return await db.select().from(ledgerEntries)
            .where(and(...conditions))
            .orderBy(desc(ledgerEntries.entryDate));
    }

    // Rules
    async getClassificationRules(organizationId: number) {
        return await db.select().from(classificationRules)
            .where(eq(classificationRules.organizationId, organizationId))
            .orderBy(desc(classificationRules.priority));
    }

    // Feedback
    async recordFeedback(data: InsertClassificationFeedback) {
        return await db.insert(classificationFeedback).values(data);
    }

    // Audit
    async logAction(data: InsertAccountingAuditLog) {
        return await db.insert(accountingAuditLogs).values(data);
    }
}

export const accountingStorage = new AccountingStorage();

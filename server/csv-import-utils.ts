import { parse } from 'csv-parse/sync';
import { z } from 'zod';
import { insertLeadSchema, type InsertLead } from '../shared/schema';

export interface CSVImportResult {
    success: boolean;
    totalRows: number;
    successfulImports: number;
    failedImports: number;
    duplicates: number;
    errors: Array<{
        row: number;
        data: any;
        error: string;
    }>;
}

export interface CSVColumnMapping {
    // Maps CSV column names to Lead schema fields
    name: string | number; // CSV column name or index for student name
    phone: string | number; // CSV column for phone/parent phone
    email?: string | number; // CSV column for email (optional)
    class: string | number; // CSV column for class
    stream?: string | number; // CSV column for stream (optional)
    source: string | number; // CSV column for lead source
    parentName?: string | number; // CSV column for parent name (optional)
    parentPhone?: string | number; // CSV column for parent phone (optional)
    address?: string | number; // CSV column for address (optional)
    notes?: string | number; // CSV column for notes (optional)
    interestedProgram?: string | number; // CSV column for program interest (optional)
}

/**
 * Parse CSV file content into records
 */
export function parseCSV(fileContent: string | Buffer): any[] {
    try {
        const records = parse(fileContent, {
            columns: true, // Use first row as column names
            skip_empty_lines: true,
            trim: true,
            bom: true, // Handle BOM (Byte Order Mark) for UTF-8 files
        });
        return records;
    } catch (error) {
        throw new Error(`Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Get value from CSV record using column name or index
 */
function getCSVValue(record: any, column: string | number | undefined): string | undefined {
    if (column === undefined) return undefined;

    if (typeof column === 'number') {
        // If column is a number (index), get by position
        const values = Object.values(record);
        return values[column] as string | undefined;
    }

    // If column is a string (name), get by key (case-insensitive)
    const keys = Object.keys(record);
    const key = keys.find(k => k.toLowerCase() === column.toLowerCase());
    return key ? record[key] : undefined;
}

/**
 * Transform CSV record into Lead object based on column mapping
 */
export function transformCSVRecord(
    record: any,
    mapping: CSVColumnMapping,
    defaultSource: string = 'csv_import',
    organizationId: number
): InsertLead {
    const name = getCSVValue(record, mapping.name) || '';
    const phone = getCSVValue(record, mapping.phone) || '';
    const email = getCSVValue(record, mapping.email) || '';
    const className = getCSVValue(record, mapping.class) || '';
    const stream = getCSVValue(record, mapping.stream) || '';
    const source = getCSVValue(record, mapping.source) || defaultSource;
    const parentName = getCSVValue(record, mapping.parentName) || '';
    const parentPhone = getCSVValue(record, mapping.parentPhone) || phone; // Use main phone if parent phone not provided
    const address = getCSVValue(record, mapping.address) || '';
    const notes = getCSVValue(record, mapping.notes) || '';
    const interestedProgram = getCSVValue(record, mapping.interestedProgram) || '';

    return {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        class: className.trim(),
        stream: stream.trim() || undefined,
        source: source.trim(),
        status: 'new',
        parentName: parentName.trim() || undefined,
        parentPhone: parentPhone.trim() || undefined,
        address: address.trim() || undefined,
        notes: notes.trim() || undefined,
        interestedProgram: interestedProgram.trim() || undefined,
        organizationId,
    };
}

/**
 * Validate lead data against schema
 */
export function validateLead(lead: InsertLead): { valid: boolean; error?: string } {
    try {
        insertLeadSchema.parse(lead);
        return { valid: true };
    } catch (error) {
        if (error instanceof z.ZodError) {
            const errorMessages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
            return { valid: false, error: errorMessages };
        }
        return { valid: false, error: 'Unknown validation error' };
    }
}

/**
 * Auto-detect CSV column mapping by analyzing headers
 */
export function autoDetectColumnMapping(headers: string[]): Partial<CSVColumnMapping> {
    const mapping: Partial<CSVColumnMapping> = {};

    const lowerHeaders = headers.map(h => h.toLowerCase().trim());

    // Common variations for each field
    const nameVariations = ['name', 'student name', 'student_name', 'fullname', 'full_name', 'studentname'];
    const phoneVariations = ['phone', 'mobile', 'contact', 'phone number', 'mobile number', 'phone_number', 'contact_number'];
    const emailVariations = ['email', 'email address', 'email_address', 'e-mail'];
    const classVariations = ['class', 'grade', 'standard', 'class_name'];
    const streamVariations = ['stream', 'branch', 'specialization', 'course'];
    const sourceVariations = ['source', 'lead source', 'lead_source', 'source_name'];
    const parentNameVariations = ['parent name', 'parent_name', 'parentname', 'father name', 'mother name', 'guardian'];
    const parentPhoneVariations = ['parent phone', 'parent_phone', 'parent mobile', 'parent_mobile', 'guardian phone'];
    const addressVariations = ['address', 'location', 'city', 'residence'];
    const notesVariations = ['notes', 'remarks', 'comments', 'description'];
    const programVariations = ['program', 'course', 'interested program', 'interested_program', 'programme'];

    // Find matching columns
    lowerHeaders.forEach((header, index) => {
        if (nameVariations.some(v => header.includes(v))) mapping.name = headers[index];
        else if (phoneVariations.some(v => header.includes(v))) mapping.phone = headers[index];
        else if (emailVariations.some(v => header.includes(v))) mapping.email = headers[index];
        else if (classVariations.some(v => header.includes(v))) mapping.class = headers[index];
        else if (streamVariations.some(v => header.includes(v))) mapping.stream = headers[index];
        else if (sourceVariations.some(v => header.includes(v))) mapping.source = headers[index];
        else if (parentNameVariations.some(v => header.includes(v))) mapping.parentName = headers[index];
        else if (parentPhoneVariations.some(v => header.includes(v))) mapping.parentPhone = headers[index];
        else if (addressVariations.some(v => header.includes(v))) mapping.address = headers[index];
        else if (notesVariations.some(v => header.includes(v))) mapping.notes = headers[index];
        else if (programVariations.some(v => header.includes(v))) mapping.interestedProgram = headers[index];
    });

    return mapping;
}

/**
 * Process CSV import with full validation and error handling
 */
export async function processCSVImport(
    fileContent: string | Buffer,
    columnMapping: CSVColumnMapping,
    organizationId: number,
    insertLeadFunction: (lead: InsertLead) => Promise<void>,
    checkDuplicateFunction: (phone: string, organizationId: number) => Promise<boolean>
): Promise<CSVImportResult> {
    const result: CSVImportResult = {
        success: true,
        totalRows: 0,
        successfulImports: 0,
        failedImports: 0,
        duplicates: 0,
        errors: [],
    };

    try {
        // Parse CSV
        const records = parseCSV(fileContent);
        result.totalRows = records.length;

        // Process each record
        for (let i = 0; i < records.length; i++) {
            const record = records[i];
            const rowNumber = i + 2; // +2 because of 0-index and header row

            try {
                // Transform record to lead object
                const lead = transformCSVRecord(record, columnMapping, 'csv_import', organizationId);

                // Validate lead
                const validation = validateLead(lead);
                if (!validation.valid) {
                    result.failedImports++;
                    result.errors.push({
                        row: rowNumber,
                        data: record,
                        error: validation.error || 'Validation failed',
                    });
                    continue;
                }

                // Check for duplicates (by phone number)
                const isDuplicate = await checkDuplicateFunction(lead.phone, organizationId);
                if (isDuplicate) {
                    result.duplicates++;
                    result.errors.push({
                        row: rowNumber,
                        data: record,
                        error: `Duplicate phone number: ${lead.phone}`,
                    });
                    continue;
                }

                // Insert lead
                await insertLeadFunction(lead);
                result.successfulImports++;
            } catch (error) {
                result.failedImports++;
                result.errors.push({
                    row: rowNumber,
                    data: record,
                    error: error instanceof Error ? error.message : 'Unknown error during import',
                });
            }
        }

        result.success = result.failedImports === 0;
    } catch (error) {
        result.success = false;
        result.errors.push({
            row: 0,
            data: {},
            error: error instanceof Error ? error.message : 'Failed to process CSV file',
        });
    }

    return result;
}

/**
 * Password Hashing Utility for EduLeadPro
 * Uses bcrypt for secure password hashing with backward compatibility for legacy plaintext passwords.
 */

import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

/**
 * Hash a plaintext password using bcrypt
 * @param plaintext The plaintext password to hash
 * @returns The bcrypt hash
 */
export async function hashPassword(plaintext: string): Promise<string> {
    return bcrypt.hash(plaintext, SALT_ROUNDS);
}

/**
 * Compare a plaintext password against a stored hash
 * Handles backward compatibility with legacy plaintext passwords
 * @param plaintext The plaintext password to verify
 * @param storedPassword The stored password (can be bcrypt hash or legacy plaintext)
 * @returns True if password matches
 */
export async function comparePassword(plaintext: string, storedPassword: string): Promise<boolean> {
    // Handle legacy plaintext passwords (not starting with $2 bcrypt prefix)
    // This allows existing users to login while migration is in progress
    if (!storedPassword.startsWith('$2')) {
        return plaintext === storedPassword;
    }

    // Compare using bcrypt for properly hashed passwords
    return bcrypt.compare(plaintext, storedPassword);
}

/**
 * Check if a password is already hashed (bcrypt format)
 * @param password The password to check
 * @returns True if password is already hashed
 */
export function isHashed(password: string): boolean {
    return password.startsWith('$2');
}

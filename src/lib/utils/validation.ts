/**
 * Validates phone number format
 * @param phone - Phone number to validate
 * @returns true if valid
 */
export function isValidPhone(phone: string): boolean {
    // Pakistani phone validation - exactly 11 digits (e.g., 03001234567)
    const phoneRegex = /^03\d{9}$/
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''))
}

/**
 * Validates CNIC format (13101-2345678-9)
 * @param cnic - CNIC to validate
 * @returns true if valid
 */
export function isValidCNIC(cnic: string): boolean {
    // CNIC format: 5 digits - 7 digits - 1 digit
    const cnicRegex = /^\d{5}-\d{7}-\d{1}$/
    return cnicRegex.test(cnic)
}

/**
 * Validates invoice number format
 * @param invoice - Invoice number to validate
 * @returns true if valid
 */
export function isValidInvoice(invoice: string): boolean {
    // Invoice should not be empty and have at least 3 characters
    return invoice.trim().length >= 3
}

/**
 * Validates URL format
 * @param url - URL to validate
 * @returns true if valid
 */
export function isValidUrl(url: string): boolean {
    try {
        new URL(url)
        return true
    } catch {
        return false
    }
}

/**
 * Validates required field
 * @param value - Value to check
 * @returns true if not empty
 */
export function isRequired(value: string | null | undefined): boolean {
    return value !== null && value !== undefined && value.trim().length > 0
}

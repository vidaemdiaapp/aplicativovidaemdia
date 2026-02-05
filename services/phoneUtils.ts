/**
 * Normalizes Brazilian phone numbers to the format: 55[DDD][Number]
 * Ensures the 55 prefix is present and only digits are returned.
 */
export function normalizePhoneBR(phone: string): string {
    // Remove all non-digits
    let digits = phone.replace(/\D/g, '');

    // If it's an empty string, return it
    if (!digits) return '';

    // If it already starts with 55 and has 12 or 13 digits, it's likely already normalized
    if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
        return digits;
    }

    // If it has 10 or 11 digits, it's a BR number without DDI
    if (digits.length === 10 || digits.length === 11) {
        return '55' + digits;
    }

    // If it's a number starting with 0, remove and try again
    if (digits.startsWith('0')) {
        return normalizePhoneBR(digits.slice(1));
    }

    // Fallback: return what we have
    return digits;
}

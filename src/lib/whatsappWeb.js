/**
 * Opens WhatsApp Web / app with a pre-filled message (wa.me). No server-side WhatsApp API.
 */

/** Default country code when numbers are stored as 0XXXXXXXXX (common in Sri Lanka). */
const DEFAULT_CC = '94';

export function normalizePhoneForWhatsApp(input, countryCode = DEFAULT_CC) {
    let d = String(input ?? '').replace(/\D/g, '');
    if (!d) return null;

    const cc = String(countryCode).replace(/\D/g, '') || DEFAULT_CC;

    while (d.startsWith(cc + cc)) {
        d = d.slice(cc.length);
    }

    if (d.startsWith('0')) {
        d = cc + d.slice(1);
    } else if (d.length === 9 && /^7[0-9]{8}$/.test(d)) {
        d = cc + d;
    } else if (d.startsWith(cc) && d.length === cc.length + 9 && /^7[0-9]{8}$/.test(d.slice(cc.length))) {
        // already 94 + 9-digit mobile
    } else if (d.length === 10 && /^7[0-9]{9}$/.test(d)) {
        d = cc + d;
    } else if (d.length >= 11 && d.startsWith(cc)) {
        const national = d.slice(cc.length);
        if (national.length === 9 && /^7[0-9]{8}$/.test(national)) {
            d = cc + national;
        } else {
            return null;
        }
    } else {
        return null;
    }

    const national = d.slice(cc.length);
    if (national.length === 9 && /^7[0-9]{8}$/.test(national)) {
        return d;
    }

    return null;
}

export function buildWhatsAppWebUrl(phoneDigits, message) {
    const p = normalizePhoneForWhatsApp(phoneDigits) || String(phoneDigits ?? '').replace(/\D/g, '');
    if (!p) return null;
    const text = message ?? '';
    return `https://wa.me/${p}?text=${encodeURIComponent(text)}`;
}

export function pickCustomerWhatsAppPhone(customer) {
    if (!customer) return null;
    const type = String(customer.type || '').toUpperCase();
    if (type === 'CORPORATE') {
        return (
            customer.contactPersonMobile ||
            customer.mobile ||
            customer.phone ||
            customer.closeRelationMobile ||
            null
        );
    }
    return (
        customer.mobile ||
        customer.phone ||
        customer.contactPersonMobile ||
        customer.closeRelationMobile ||
        null
    );
}

export function openWhatsAppWeb(phoneDigits, message) {
    const url = buildWhatsAppWebUrl(phoneDigits, message);
    if (!url) return false;
    const popup = window.open(url, '_blank', 'noopener,noreferrer');
    if (!popup) {
        window.location.href = url;
    }
    return true;
}

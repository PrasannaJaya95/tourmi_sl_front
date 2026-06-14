/**
 * Rental period math (mirrors back/src/lib/rentalPeriod.js).
 * Used by the Contracts UI; server-side billing uses the back copy.
 */

const MS_PER_RENTAL_DAY = 24 * 60 * 60 * 1000;
const MS_PER_MINUTE = 60 * 1000;
const WHOLE_DAY_TOLERANCE_MS = MS_PER_MINUTE;

export function parseTimeTo24h(timeStr) {
    if (!timeStr || typeof timeStr !== 'string') return null;
    const t = timeStr.trim().toUpperCase();

    const m24 = /^(\d{1,2}):(\d{2})$/.exec(t);
    if (m24) {
        const h = Number(m24[1]);
        const min = Number(m24[2]);
        if (h >= 0 && h <= 23 && min >= 0 && min <= 59) return { h, min };
        return null;
    }

    const m12 = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/.exec(t);
    if (m12) {
        let h = Number(m12[1]);
        const min = Number(m12[2]);
        const ap = m12[3];
        if (h < 1 || h > 12 || min < 0 || min > 59) return null;
        if (ap === 'PM' && h !== 12) h += 12;
        if (ap === 'AM' && h === 12) h = 0;
        return { h, min };
    }

    return null;
}

export function combineDateAndTime(dateVal, timeStr) {
    if (!dateVal) return null;
    const d = dateVal instanceof Date ? dateVal : new Date(dateVal);
    if (isNaN(d.getTime())) return null;

    const parsed = parseTimeTo24h(timeStr);
    if (!parsed) return null;

    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), parsed.h, parsed.min, 0, 0);
}

function coerceDate(value) {
    if (!value) return null;
    const d = value instanceof Date ? value : new Date(value);
    return Number.isFinite(d.getTime()) ? d : null;
}

export function isMidnightTime(timeStr) {
    const p = parseTimeTo24h(timeStr);
    return Boolean(p && p.h === 0 && p.min === 0);
}

export function isEndOfDayTime(timeStr) {
    const p = parseTimeTo24h(timeStr);
    return Boolean(p && p.h === 23 && p.min === 59);
}

function isWholeDayUnits(units) {
    if (!Number.isFinite(units)) return false;
    return Math.abs(units - Math.round(units)) * MS_PER_RENTAL_DAY <= WHOLE_DAY_TOLERANCE_MS;
}

function normalizeRentalDayUnits(rawUnits) {
    if (!Number.isFinite(rawUnits) || rawUnits <= 0) return rawUnits;
    const rounded = Math.round(rawUnits);
    const diffMs = Math.abs(rawUnits - rounded) * MS_PER_RENTAL_DAY;
    if (diffMs <= WHOLE_DAY_TOLERANCE_MS) return rounded;
    return rawUnits;
}

function rawRentalDayUnits(pickupDate, pickupTime, dropoffDate, dropoffTime) {
    const start = combineDateAndTime(pickupDate, pickupTime);
    const end = combineDateAndTime(dropoffDate, dropoffTime);
    if (!start || !end) return null;
    const ms = end.getTime() - start.getTime();
    if (!Number.isFinite(ms) || ms <= 0) return null;
    return ms / MS_PER_RENTAL_DAY;
}

export function computeRentalDayUnits(pickupDate, pickupTime, dropoffDate, dropoffTime) {
    const raw = rawRentalDayUnits(pickupDate, pickupTime, dropoffDate, dropoffTime);
    if (raw == null) return null;
    return normalizeRentalDayUnits(raw);
}

export function formatRentalPeriod(pickupDate, pickupTime, dropoffDate, dropoffTime) {
    const start = combineDateAndTime(pickupDate, pickupTime);
    const end = combineDateAndTime(dropoffDate, dropoffTime);
    if (!start || !end) return '—';
    const ms = end.getTime() - start.getTime();
    if (!Number.isFinite(ms) || ms <= 0) return '—';

    const units = normalizeRentalDayUnits(ms / MS_PER_RENTAL_DAY);
    if (isWholeDayUnits(units)) {
        const n = Math.round(units);
        return n === 1 ? '1 day' : `${n} days`;
    }

    const totalMinutes = Math.floor(ms / MS_PER_MINUTE);
    const days = Math.floor(totalMinutes / (24 * 60));
    const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
    const minutes = totalMinutes % 60;
    const parts = [];
    if (days) parts.push(`${days} day${days !== 1 ? 's' : ''}`);
    if (hours) parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
    if (minutes) parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
    return parts.length ? parts.join(', ') : 'Less than 1 minute';
}

export function getAgreementToDate(pickupDate, pickupTime, dropoffDate, dropoffTime) {
    const dropD = coerceDate(dropoffDate);
    if (!dropD) return null;

    const units = computeRentalDayUnits(pickupDate, pickupTime, dropoffDate, dropoffTime);
    if (!isMidnightTime(pickupTime) || !units || units < 1 || !isWholeDayUnits(units)) {
        return dropD;
    }

    if (isMidnightTime(dropoffTime)) {
        return new Date(dropD.getFullYear(), dropD.getMonth(), dropD.getDate() - 1);
    }

    if (isEndOfDayTime(dropoffTime)) {
        return new Date(dropD.getFullYear(), dropD.getMonth(), dropD.getDate());
    }

    return dropD;
}

export function getAgreementRentalDays(pickupDate, pickupTime, dropoffDate, dropoffTime) {
    const units = computeRentalDayUnits(pickupDate, pickupTime, dropoffDate, dropoffTime);
    if (!units || units <= 0) return 0;
    return Math.max(1, Math.round(units));
}

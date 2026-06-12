/**
 * Restore discount UI state from a saved contract or quotation.
 * Uses persisted discountType/discountValue when present; otherwise infers
 * percentage from catalog base rate vs applied rate (legacy records).
 */
export function restoreDiscountFromRecord(record, catalogBaseRate = 0) {
    const storedType = String(record?.discountType || '').toUpperCase();
    if (storedType === 'PERCENT' || storedType === 'AMOUNT') {
        const base =
            Number(record.baseDailyRate) ||
            Number(catalogBaseRate) ||
            Number(record.appliedDailyRate ?? record.dailyRate) ||
            0;
        return {
            discountType: storedType,
            discountValue: String(record.discountValue ?? 0),
            baseDailyRate: base,
        };
    }

    const base =
        Number(catalogBaseRate) > 0
            ? Number(catalogBaseRate)
            : Number(record?.appliedDailyRate ?? record?.dailyRate) || 0;
    const applied = Number(record?.appliedDailyRate ?? record?.dailyRate) || 0;

    if (base > 0 && applied <= base) {
        const pct = ((base - applied) / base) * 100;
        return {
            discountType: 'PERCENT',
            discountValue: String(Number.isFinite(pct) ? Number(pct.toFixed(2)) : 0),
            baseDailyRate: base,
        };
    }

    return {
        discountType: 'PERCENT',
        discountValue: '0',
        baseDailyRate: base || applied,
    };
}

export function discountPayloadFields(baseDailyRate, discountType, discountValue) {
    const toNum = (val) => {
        if (val === '' || val === null || val === undefined) return 0;
        const n = Number(val);
        return Number.isFinite(n) ? n : 0;
    };
    const type = String(discountType || 'PERCENT').toUpperCase();
    return {
        baseDailyRate: toNum(baseDailyRate),
        discountType: type === 'AMOUNT' ? 'AMOUNT' : 'PERCENT',
        discountValue: toNum(discountValue),
    };
}

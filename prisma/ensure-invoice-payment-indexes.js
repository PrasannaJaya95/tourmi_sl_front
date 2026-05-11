/**
 * One-time index repair for the `InvoicePayment` collection.
 *
 * Why this exists:
 *   The schema previously had `advanceReceiptId String? @unique`. Prisma's
 *   MongoDB connector translates that to a *regular* unique index, which
 *   treats `null` / missing-field as a single value. Effect: only ONE payment
 *   row in the entire collection could have a missing `advanceReceiptId` —
 *   meaning the moment a second cash payment (with no advance receipt link)
 *   was attempted, MongoDB threw:
 *       Unique constraint failed on the constraint:
 *       `InvoicePayment_advanceReceiptId_key`
 *
 *   The intent of the unique constraint is "one payment per posted advance
 *   receipt", which only makes sense when `advanceReceiptId` is non-null. The
 *   correct shape is a *partial* unique index filtered to that case.
 *
 * What this script does:
 *   1. Drops the old `InvoicePayment_advanceReceiptId_key` regular unique
 *      index if it exists (the one Prisma created from the old `@unique`).
 *   2. Drops any previous partial-unique index of ours so we can recreate
 *      it cleanly (idempotency).
 *   3. Creates a new partial unique index on `{ advanceReceiptId: 1 }` with
 *      the filter `advanceReceiptId: { $type: 'objectId' }`, so only rows
 *      that actually link to an advance receipt are unique-checked. Cash
 *      payments (with the field absent) are left out of the index entirely.
 *
 *   The plain non-unique lookup index (`InvoicePayment_advanceReceiptId_idx`)
 *   is now declared in `schema.prisma` via `@@index([advanceReceiptId])` and
 *   is managed by `prisma db push`, so this script does not touch it.
 *
 * Idempotent: safe to run multiple times.
 *
 * Usage (from the `back/` directory):
 *   node prisma/ensure-invoice-payment-indexes.js
 *
 * Run this once on every environment (local, staging, live) AFTER pulling
 * the schema change that drops `@unique` on `InvoicePayment.advanceReceiptId`.
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');

const OLD_UNIQUE_NAME = 'InvoicePayment_advanceReceiptId_key';
const PARTIAL_UNIQUE_NAME = 'InvoicePayment_advanceReceiptId_unique_partial';

async function dropIndexIfExists(coll, name) {
    const existing = await coll.indexes();
    const found = existing.find((ix) => ix.name === name);
    if (!found) return false;
    await coll.dropIndex(name);
    console.log(`  dropped ${name}`);
    return true;
}

async function main() {
    const url = process.env.DATABASE_URL;
    if (!url) {
        console.error('DATABASE_URL is not set');
        process.exit(1);
    }

    const client = new MongoClient(url);
    try {
        await client.connect();
        const db = client.db();
        const coll = db.collection('InvoicePayment');

        console.log('Inspecting existing indexes on InvoicePayment...');
        const before = await coll.indexes();
        before.forEach((ix) => console.log(`  - ${ix.name} ${JSON.stringify(ix.key)}${ix.unique ? ' (unique)' : ''}${ix.partialFilterExpression ? ` (partial: ${JSON.stringify(ix.partialFilterExpression)})` : ''}`));

        console.log('Dropping legacy indexes (if present)...');
        await dropIndexIfExists(coll, OLD_UNIQUE_NAME);
        await dropIndexIfExists(coll, PARTIAL_UNIQUE_NAME);

        console.log('Creating partial unique index on advanceReceiptId (non-null rows only)...');
        await coll.createIndex(
            { advanceReceiptId: 1 },
            {
                name: PARTIAL_UNIQUE_NAME,
                unique: true,
                partialFilterExpression: { advanceReceiptId: { $type: 'objectId' } },
            },
        );
        console.log(`  created ${PARTIAL_UNIQUE_NAME}`);

        console.log('Final indexes on InvoicePayment:');
        const after = await coll.indexes();
        after.forEach((ix) => console.log(`  - ${ix.name} ${JSON.stringify(ix.key)}${ix.unique ? ' (unique)' : ''}${ix.partialFilterExpression ? ` (partial: ${JSON.stringify(ix.partialFilterExpression)})` : ''}`));

        console.log('Done.');
    } catch (err) {
        console.error('Index repair failed:', err);
        process.exitCode = 1;
    } finally {
        await client.close();
    }
}

main();

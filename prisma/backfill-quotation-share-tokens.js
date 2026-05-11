/**
 * One-time backfill: assigns a non-null `share_token` to every Quotation that
 * still has `share_token: null` OR is missing the field entirely.
 *
 * Why this exists:
 *   The `Quotation.shareToken` column is `String? @unique`. MongoDB's regular
 *   unique index treats a missing field / null as a real value, so only ONE
 *   document is allowed to have `share_token: null`. Earlier versions of
 *   `createQuotation()` did not set the field, which is why the live server
 *   eventually failed with `Quotation_share_token_key` on the second insert.
 *
 *   The application code is now fixed to always allocate a token at create
 *   time, but any legacy row that already has `share_token: null` (or missing)
 *   would still occupy the lone "null slot". This script clears that out by
 *   giving every such row a real, unique 12-character token.
 *
 * Usage (from the `back/` directory):
 *   node prisma/backfill-quotation-share-tokens.js
 *
 * Reads DATABASE_URL from the environment / .env. Uses the raw MongoDB driver
 * (instead of Prisma) so it can match both `null` and missing fields, and so
 * it works even when the unique index on share_token has not yet been created.
 */

require('dotenv').config();
const crypto = require('crypto');
const { MongoClient } = require('mongodb');

const SHARE_TOKEN_CHARS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function randomShareTokenChars(length = 12) {
    let out = '';
    for (let i = 0; i < length; i++) {
        out += SHARE_TOKEN_CHARS[crypto.randomInt(0, SHARE_TOKEN_CHARS.length)];
    }
    return out;
}

async function allocateUniqueToken(coll) {
    for (let attempt = 0; attempt < 10; attempt++) {
        const token = randomShareTokenChars(12);
        const clash = await coll.findOne({ share_token: token }, { projection: { _id: 1 } });
        if (!clash) return token;
    }
    throw new Error('Failed to allocate share token after multiple attempts');
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
        const coll = db.collection('Quotation');

        // Match docs where share_token is null OR missing.
        const filter = { $or: [{ share_token: null }, { share_token: { $exists: false } }] };
        const rows = await coll.find(filter, { projection: { _id: 1, quotation_no: 1 } }).toArray();

        if (rows.length === 0) {
            console.log('No quotations with null/missing share_token — nothing to do.');
            return;
        }

        console.log(`Backfilling share_token for ${rows.length} quotation(s)...`);
        let updated = 0;
        for (const row of rows) {
            const token = await allocateUniqueToken(coll);
            await coll.updateOne({ _id: row._id }, { $set: { share_token: token } });
            updated += 1;
            console.log(`  ${row.quotation_no || row._id} -> ${token}`);
        }
        console.log(`Done. Updated ${updated} quotation(s).`);
    } catch (err) {
        console.error('Backfill failed:', err);
        process.exitCode = 1;
    } finally {
        await client.close();
    }
}

main();

/**
 * One-time / idempotent index setup for the `Agreement` collection.
 *
 * Why this exists:
 *   We added a short opaque `shareToken` to the Agreement model so that the
 *   public preview URL can be `/api/a/<12-char-token>` instead of the long
 *   JWT-bearing `/api/agreements/share/<id>?token=<jwt>` form.
 *
 *   On MongoDB, a regular unique index treats missing/`null` values as a
 *   collision, so any pre-existing agreements without a `shareToken` would
 *   immediately conflict with each other. We instead want uniqueness only on
 *   rows that actually have a string token.
 *
 *   That is what a *partial* unique index gives us — it only indexes rows
 *   whose `shareToken` is a string, so legacy agreements without one are
 *   left out of the constraint entirely.
 *
 * What this script does:
 *   1. Drops any old `Agreement_shareToken_key` regular unique index
 *      (in case a future schema change accidentally introduces `@unique`).
 *   2. Drops our previous partial-unique index so it can be recreated
 *      cleanly (idempotent).
 *   3. Creates a new partial unique index on `{ shareToken: 1 }` filtered
 *      to `{ shareToken: { $type: 'string' } }`.
 *
 *   The plain non-unique lookup index (`Agreement_shareToken_idx`) is
 *   declared in `schema.prisma` via `@@index([shareToken])` and managed by
 *   `prisma db push`, so this script does not touch it.
 *
 * Usage (from the `back/` directory):
 *   node prisma/ensure-agreement-share-token-index.js
 *
 * Run this once on every environment (local, staging, live) AFTER pulling
 * the schema change that adds `shareToken` to `Agreement`.
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');

const OLD_UNIQUE_NAME = 'Agreement_shareToken_key';
const PARTIAL_UNIQUE_NAME = 'Agreement_shareToken_unique_partial';

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
        const coll = db.collection('Agreement');

        console.log('Inspecting existing indexes on Agreement...');
        const before = await coll.indexes();
        before.forEach((ix) => console.log(`  - ${ix.name} ${JSON.stringify(ix.key)}${ix.unique ? ' (unique)' : ''}${ix.partialFilterExpression ? ` (partial: ${JSON.stringify(ix.partialFilterExpression)})` : ''}`));

        console.log('Dropping legacy indexes (if present)...');
        await dropIndexIfExists(coll, OLD_UNIQUE_NAME);
        await dropIndexIfExists(coll, PARTIAL_UNIQUE_NAME);

        console.log('Creating partial unique index on shareToken (string-only rows)...');
        await coll.createIndex(
            { shareToken: 1 },
            {
                name: PARTIAL_UNIQUE_NAME,
                unique: true,
                partialFilterExpression: { shareToken: { $type: 'string' } },
            },
        );
        console.log(`  created ${PARTIAL_UNIQUE_NAME}`);

        console.log('Final indexes on Agreement:');
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

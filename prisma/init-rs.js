const { MongoClient } = require('mongodb');

async function main() {
    const url = 'mongodb://localhost:27017';
    const client = new MongoClient(url);

    try {
        await client.connect();
        console.log('Connected to MongoDB');
        const admin = client.db('admin');
        const result = await admin.command({ replSetInitiate: {} });
        console.log('Replica set initialized:', result);
    } catch (err) {
        console.error('Failed to initialize replica set:', err.message);
    } finally {
        await client.close();
    }
}

main();

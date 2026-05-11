const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

async function main() {
    const url = 'mongodb://localhost:27017';
    const dbName = 'rentix_moratuwa';
    const client = new MongoClient(url);

    try {
        await client.connect();
        const db = client.db(dbName);

        const email = 'superadmin@codebraze.lk';
        const password = 'SuperAdmin@codebraze';
        const hashedPassword = await bcrypt.hash(password, 10);

        const existing = await db.collection('User').findOne({ email });
        if (!existing) {
            await db.collection('User').insertOne({
                email,
                password: hashedPassword,
                name: 'Super Admin',
                role: 'ADMIN',
                createdAt: new Date(),
                updatedAt: new Date()
            });
            console.log('Super Admin created successfully!');
        } else {
            console.log('Super Admin already exists.');
        }

    } catch (err) {
        console.error('Failed to create Admin:', err);
    } finally {
        await client.close();
    }
}

main();

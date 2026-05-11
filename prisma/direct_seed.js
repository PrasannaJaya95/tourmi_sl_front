const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

async function run() {
    const uri = "mongodb://127.0.0.1:27017";
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const database = client.db('rentix_moratuwa_test');
        const users = database.collection('User');
        
        const email = 'superadmin@codebraze.lk';
        const password = 'SuperAdmin@codebraze';
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const existing = await users.findOne({ email });
        if (existing) {
            console.log("User already exists. Updating password.");
            await users.updateOne({ email }, { $set: { password: hashedPassword, updatedAt: new Date() } });
        } else {
            await users.insertOne({
                email,
                password: hashedPassword,
                name: 'Super Admin',
                role: 'ADMIN',
                createdAt: new Date(),
                updatedAt: new Date()
            });
            console.log("User created successfully.");
        }
    } finally {
        await client.close();
    }
}
run().catch(console.dir);

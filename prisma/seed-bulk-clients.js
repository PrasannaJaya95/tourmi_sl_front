const { MongoClient } = require('mongodb');

async function main() {
    const url = 'mongodb://localhost:27017';
    const dbName = 'rentix_moratuwa';
    const client = new MongoClient(url);

    try {
        await client.connect();
        console.log('Connected to MongoDB');
        const db = client.db(dbName);

        console.log('Seeding 45 additional clients...');
        const firstNames = ['James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica'];
        const lastNames = ['Silva', 'Perera', 'Fernando', 'De Silva', 'Mendis', 'Rodrigo', 'Gunawardena', 'Jayasinghe', 'Rajapaksha', 'Kumara', 'Wickramasinghe'];

        const extraClients = [];
        for (let i = 1; i <= 45; i++) {
            const fName = firstNames[Math.floor(Math.random() * firstNames.length)];
            const lName = lastNames[Math.floor(Math.random() * lastNames.length)];
            const code = `CUS/${String(i + 10).padStart(5, '0')}`; // Offset from existing
            
            extraClients.push({
                code,
                type: 'LOCAL',
                name: `${fName} ${lName}`,
                email: `${fName.toLowerCase()}.${i}@example.com`,
                phone: `+94 77 ${Math.floor(1000000 + Math.random() * 9000000)}`,
                address: `${Math.floor(10 + Math.random() * 900)}, Main Road, Colombo`,
                nicOrPassport: `${Math.floor(1970 + Math.random() * 30)}${Math.floor(10000000 + Math.random() * 90000000)}`,
                status: 'CONFIRMED',
                createdAt: new Date(),
                updatedAt: new Date(),
                loyaltyPoints: Math.floor(Math.random() * 500)
            });
        }

        const res = await db.collection('Client').insertMany(extraClients);
        console.log(`Successfully added ${res.insertedCount} new clients!`);

    } catch (err) {
        console.error('Seeding failed:', err);
    } finally {
        await client.close();
    }
}

main();

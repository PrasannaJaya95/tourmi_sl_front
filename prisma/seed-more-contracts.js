const { MongoClient, ObjectId } = require('mongodb');

async function main() {
    const url = 'mongodb://localhost:27017';
    const dbName = 'rentix_moratuwa';
    const client = new MongoClient(url);

    try {
        await client.connect();
        const db = client.db(dbName);

        const clients = await db.collection('Client').find({ code: { $in: ['CUS/00003', 'CUS/00004'] } }).toArray();
        const vehicles = await db.collection('Vehicle').find({ licensePlate: { $in: ['CAD-9999', 'WP-CBA-1122'] } }).toArray();

        if (clients.length < 2 || vehicles.length < 2) {
            console.error('Prerequisites not found. Run extra seeder first.');
            return;
        }

        // Add 2 more contracts and agreements
        for (let i = 0; i < 2; i++) {
            const contractNo = `CON-2024-000${i + 3}`;
            const existing = await db.collection('Contract').findOne({ contractNo });
            
            if (!existing) {
                const res = await db.collection('Contract').insertOne({
                    contractNo,
                    customerId: clients[i]._id,
                    vehicleId: vehicles[i]._id,
                    pickupDate: new Date(),
                    pickupTime: '10:00',
                    dropoffDate: new Date(Date.now() + (i + 3) * 24 * 60 * 60 * 1000),
                    dropoffTime: '18:00',
                    fuelLevel: 'FULL',
                    startOdometer: 1000,
                    appliedDailyRate: 9000,
                    securityDeposit: 60000,
                    status: 'IN_PROGRESS',
                    frontTyres: '100%',
                    rearTyres: '100%',
                    createdAt: new Date(),
                    updatedAt: new Date()
                });

                await db.collection('Agreement').insertOne({
                    agreementNo: `AGR-2024-0000${i + 3}`,
                    sequence: i + 3,
                    contractId: res.insertedId,
                    customerId: clients[i]._id,
                    vehicleId: vehicles[i]._id,
                    status: 'GENERATED',
                    data: {
                        company: { name: 'Rentix Moratuwa', address: 'Moratuwa' },
                        contractNo: contractNo,
                        secondParty: { name: clients[i].name, address: clients[i].address },
                        vehicle: { number: vehicles[i].licensePlate }
                    },
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
            }
        }

        console.log('Additional Contracts and Agreements Seeded!');
    } catch (err) {
        console.error('Seeding failed:', err);
    } finally {
        await client.close();
    }
}

main();

const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');

async function main() {
    const url = 'mongodb://localhost:27017';
    const dbName = 'rentix_moratuwa';
    const client = new MongoClient(url);

    try {
        await client.connect();
        console.log('Connected to MongoDB');
        const db = client.db(dbName);

        // 1. More Vehicles
        console.log('Seeding more Vehicles...');
        const toyotaId = (await db.collection('VehicleBrand').findOne({ name: 'Toyota' }))._id;
        const priusId = (await db.collection('VehicleModel').findOne({ name: 'Prius' }))._id;
        const corollaId = (await db.collection('VehicleModel').findOne({ name: 'Corolla' }))._id;

        const extraVehicles = [
            { modelId: priusId, year: 2023, licensePlate: 'CAD-9999', color: 'Pearl', fuelType: 'Hybrid', transmission: 'Automatic', ownership: 'COMPANY', status: 'AVAILABLE', lastOdometer: 1200, createdAt: new Date(), updatedAt: new Date() },
            { modelId: corollaId, year: 2020, licensePlate: 'WP-CBA-1122', color: 'Black', fuelType: 'Petrol', transmission: 'Automatic', ownership: 'COMPANY', status: 'AVAILABLE', lastOdometer: 45000, createdAt: new Date(), updatedAt: new Date() },
            { modelId: priusId, year: 2022, licensePlate: 'CAB-8877', color: 'Red', fuelType: 'Hybrid', transmission: 'Automatic', ownership: 'COMPANY', status: 'AVAILABLE', lastOdometer: 22000, createdAt: new Date(), updatedAt: new Date() }
        ];

        for (const v of extraVehicles) {
            const existing = await db.collection('Vehicle').findOne({ licensePlate: v.licensePlate });
            if (!existing) await db.collection('Vehicle').insertOne(v);
        }

        // 2. More Clients
        console.log('Seeding more Clients...');
        const extraClients = [
            { code: 'CUS/00003', type: 'LOCAL', name: 'Samantha Perera', email: 'samantha@example.com', phone: '+94 77 555 1122', address: 'Kandy Road, Kiribathgoda', nicOrPassport: '851234567V', status: 'CONFIRMED', createdAt: new Date(), updatedAt: new Date() },
            { code: 'CUS/00004', type: 'LOCAL', name: 'Aruna Silva', email: 'aruna@example.com', phone: '+94 71 444 3322', address: 'Negombo Road, Wattala', nicOrPassport: '928887776V', status: 'CONFIRMED', createdAt: new Date(), updatedAt: new Date() },
            { code: 'CUS/00005', type: 'CORPORATE', name: 'Tech Solutions (PVT) LTD', companyName: 'Tech Solutions', email: 'info@techsolutions.lk', phone: '+94 11 222 3344', address: 'World Trade Center, Colombo', brNumber: 'PV-12345', status: 'CONFIRMED', createdAt: new Date(), updatedAt: new Date() }
        ];

        for (const c of extraClients) {
            const existing = await db.collection('Client').findOne({ code: c.code });
            if (!existing) await db.collection('Client').insertOne(c);
        }

        console.log('Additional Demo Data Seeded Successfully!');
    } catch (err) {
        console.error('Seeding failed:', err);
    } finally {
        await client.close();
    }
}

main();

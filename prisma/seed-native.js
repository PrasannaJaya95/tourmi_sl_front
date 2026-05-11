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

        // 1. Create Brands
        console.log('Seeding Brands...');
        const brands = ['Toyota', 'Honda', 'BMW'];
        const brandIds = {};
        for (const name of brands) {
            let b = await db.collection('VehicleBrand').findOne({ name });
            if (!b) {
                const res = await db.collection('VehicleBrand').insertOne({ name });
                brandIds[name] = res.insertedId;
            } else {
                brandIds[name] = b._id;
            }
        }

        // 2. Create Models
        console.log('Seeding Models...');
        const modelsData = [
            { name: 'Prius', brandId: brandIds['Toyota'] },
            { name: 'Corolla', brandId: brandIds['Toyota'] },
            { name: 'Vezel', brandId: brandIds['Honda'] },
        ];
        const modelIds = {};
        for (const m of modelsData) {
            let mod = await db.collection('VehicleModel').findOne({ name: m.name, brandId: m.brandId });
            if (!mod) {
                const res = await db.collection('VehicleModel').insertOne(m);
                modelIds[m.name] = res.insertedId;
            } else {
                modelIds[m.name] = mod._id;
            }
        }

        // 3. Create Vehicles
        console.log('Seeding Vehicles...');
        const vehicleData = [
            {
                modelId: modelIds['Prius'],
                year: 2022,
                licensePlate: 'CAB-1234',
                color: 'White',
                fuelType: 'Hybrid',
                transmission: 'Automatic',
                ownership: 'COMPANY',
                status: 'AVAILABLE',
                imageUrl: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&q=80&w=800',
                lastOdometer: 15000,
                features: 'GPS, Bluetooth',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                modelId: modelIds['Corolla'],
                year: 2021,
                licensePlate: 'CBB-5678',
                color: 'Silver',
                fuelType: 'Petrol',
                transmission: 'Automatic',
                ownership: 'COMPANY',
                status: 'AVAILABLE',
                imageUrl: 'https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&q=80&w=800',
                lastOdometer: 25000,
                features: 'Bluetooth',
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ];
        for (const v of vehicleData) {
            const existing = await db.collection('Vehicle').findOne({ licensePlate: v.licensePlate });
            if (!existing) await db.collection('Vehicle').insertOne(v);
        }

        // 4. Create Clients
        console.log('Seeding Clients...');
        const clientData = [
            {
                code: 'CUS/00001',
                type: 'LOCAL',
                name: 'John Doe',
                email: 'john@example.com',
                phone: '+94 77 123 4567',
                address: '123 Main St, Colombo 03',
                nicOrPassport: '199012345678',
                status: 'CONFIRMED',
                createdAt: new Date(),
                updatedAt: new Date(),
                loyaltyPoints: 0,
                loyaltyEnabled: true
            }
        ];
        let clientId;
        for (const c of clientData) {
            const existing = await db.collection('Client').findOne({ code: c.code });
            if (!existing) {
                const res = await db.collection('Client').insertOne(c);
                clientId = res.insertedId;
            } else {
                clientId = existing._id;
            }
        }

        // 5. Create Contract
        console.log('Seeding Contract...');
        const contractNo = 'CON-2024-0001';
        const existingContract = await db.collection('Contract').findOne({ contractNo });
        if (!existingContract) {
            const vehicle = await db.collection('Vehicle').findOne();
            await db.collection('Contract').insertOne({
                contractNo,
                customerId: clientId,
                vehicleId: vehicle._id,
                pickupDate: new Date(),
                pickupTime: '09:00',
                dropoffDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                dropoffTime: '17:00',
                fuelLevel: 'FULL',
                startOdometer: 15000,
                appliedDailyRate: 8500,
                securityDeposit: 50000,
                status: 'IN_PROGRESS',
                frontTyres: '100%',
                rearTyres: '100%',
                isDelivery: false,
                isCollection: false,
                dailyKmLimit: 100,
                allocatedKm: 100,
                extraMileageCharge: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
                upfrontReleased: false
            });
        }

        console.log('Demo Data Seeded Successfully using Native Driver!');
    } catch (err) {
        console.error('Seeding failed:', err);
    } finally {
        await client.close();
    }
}

main();

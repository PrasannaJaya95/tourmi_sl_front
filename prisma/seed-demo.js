const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
    console.log('Starting Standalone-Compatible Demo Data Seed...');

    // 1. Create Clients
    const clients = [
        {
            code: 'CUS/00001',
            type: 'LOCAL',
            name: 'John Doe',
            email: 'john@example.com',
            phone: '+94 77 123 4567',
            address: '123 Main St, Colombo 03',
            nicOrPassport: '199012345678',
            status: 'CONFIRMED'
        },
        {
            code: 'CUS/00002',
            type: 'FOREIGN',
            name: 'Jane Smith',
            email: 'jane@example.com',
            phone: '+94 71 987 6543',
            address: '45/B, Galle Road, Mount Lavinia',
            passportNo: 'P12345678',
            status: 'CONFIRMED'
        }
    ];

    for (const c of clients) {
        const existing = await prisma.client.findUnique({ where: { code: c.code } });
        if (!existing) {
            await prisma.client.create({ data: c });
        }
    }
    console.log('Clients seeded.');

    // 2. Create Vendor
    const vendorEmail = 'info@lankaautocare.com';
    const existingVendor = await prisma.user.findUnique({ where: { email: vendorEmail } });
    if (!existingVendor) {
        const hashedPassword = await bcrypt.hash('vendor123', 10);
        const user = await prisma.user.create({
            data: {
                email: vendorEmail,
                password: hashedPassword,
                name: 'Lanka Auto Care',
                role: 'VENDOR'
            }
        });
        await prisma.vendorDetails.create({
            data: {
                userId: user.id,
                vendorCode: 'VEN/00001',
                phone: '+94 11 234 5678',
                address: '78 High Level Rd, Nugegoda',
                vendorType: 'SERVICE_STATION'
            }
        });
    }
    console.log('Vendor seeded.');

    // 3. Get vehicles
    const vehicles = await prisma.vehicle.findMany({ take: 2 });
    if (vehicles.length < 2) {
        console.error('Please run seed-vehicles.js first.');
        return;
    }

    // 4. Create Contracts
    const contractNo = 'CON-2024-0001';
    const existingContract = await prisma.contract.findUnique({ where: { contractNo } });
    if (!existingContract) {
        const clientA = await prisma.client.findUnique({ where: { code: 'CUS/00001' } });
        await prisma.contract.create({
            data: {
                contractNo,
                customerId: clientA.id,
                vehicleId: vehicles[0].id,
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
                rearTyres: '100%'
            }
        });
    }
    console.log('Contracts seeded.');
    console.log('Demo Data Seed Completed.');
}

main().catch(console.error).finally(() => prisma.$disconnect());

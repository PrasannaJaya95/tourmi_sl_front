const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Starting Standalone-Compatible Vehicle Seed...');

    // 1. Brands
    const brands = ['Toyota', 'Honda', 'BMW'];
    const brandMap = {};
    for (const name of brands) {
        let b = await prisma.vehicleBrand.findUnique({ where: { name } });
        if (!b) b = await prisma.vehicleBrand.create({ data: { name } });
        brandMap[name] = b.id;
    }

    // 2. Models
    const modelsData = [
        { name: 'Prius', brandId: brandMap['Toyota'] },
        { name: 'Corolla', brandId: brandMap['Toyota'] },
        { name: 'Vezel', brandId: brandMap['Honda'] },
        { name: 'Civic', brandId: brandMap['Honda'] },
        { name: '520d', brandId: brandMap['BMW'] },
    ];
    const modelMap = {};
    for (const m of modelsData) {
        let mod = await prisma.vehicleModel.findFirst({ where: { name: m.name, brandId: m.brandId } });
        if (!mod) mod = await prisma.vehicleModel.create({ data: m });
        modelMap[m.name] = mod.id;
    }

    // 3. Vehicles
    const vehicleData = [
        {
            modelId: modelMap['Prius'],
            year: 2022,
            licensePlate: 'CAB-1234',
            color: 'White',
            fuelType: 'Hybrid',
            transmission: 'Automatic',
            ownership: 'COMPANY',
            status: 'AVAILABLE',
            imageUrl: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&q=80&w=800',
            lastOdometer: 15000,
            features: 'GPS, Bluetooth'
        },
        {
            modelId: modelMap['Corolla'],
            year: 2021,
            licensePlate: 'CBB-5678',
            color: 'Silver',
            fuelType: 'Petrol',
            transmission: 'Automatic',
            ownership: 'COMPANY',
            status: 'AVAILABLE',
            imageUrl: 'https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&q=80&w=800',
            lastOdometer: 25000,
            features: 'Bluetooth'
        }
    ];

    for (const v of vehicleData) {
        const existing = await prisma.vehicle.findFirst({ where: { licensePlate: v.licensePlate } });
        if (!existing) await prisma.vehicle.create({ data: v });
    }
    console.log('Vehicles seeded.');
}

main().catch(console.error).finally(() => prisma.$disconnect());

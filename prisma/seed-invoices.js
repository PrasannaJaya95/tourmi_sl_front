const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
    console.log('Adding Demo Invoices...');

    const client = await prisma.client.findFirst({ where: { code: 'CUS/00001' } });
    const contract = await prisma.contract.findFirst({ where: { contractNo: 'CON-2024-0001' } });
    const vehicle = await prisma.vehicle.findFirst();

    if (!client || !contract || !vehicle) {
        console.error('Dependencies not found. Run the full seeder first.');
        return;
    }

    // Create a demo invoice if it doesn't exist
    const existingInvoice = await prisma.invoice.findFirst({ where: { invoiceNo: 'INV-2024-0001' } });
    
    if (!existingInvoice) {
        await prisma.invoice.create({
            data: {
                invoiceNo: 'INV-2024-0001',
                sequence: 1,
                contractId: contract.id,
                customerId: client.id,
                vehicleId: vehicle.id,
                type: 'UPFRONT',
                subtotal: 59500,
                total: 59500,
                status: 'ISSUED',
                lines: [
                    { description: 'Rental Fee (7 days)', amount: 59500 }
                ]
            }
        });
        console.log('Demo Invoice created.');
    } else {
        console.log('Demo Invoice already exists.');
    }

    console.log('Demo Invoices complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

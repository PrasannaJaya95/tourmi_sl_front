const { MongoClient, ObjectId } = require('mongodb');

async function main() {
    const url = 'mongodb://localhost:27017';
    const dbName = 'rentix_moratuwa';
    const client = new MongoClient(url);

    try {
        await client.connect();
        const db = client.db(dbName);

        const contract = await db.collection('Contract').findOne({ contractNo: 'CON-2024-0001' });
        if (!contract) {
            console.error('Contract not found. Run the seeder first.');
            return;
        }

        const existingAgreement = await db.collection('Agreement').findOne({ contractId: contract._id });
        if (!existingAgreement) {
            // Fetch company settings for the snapshot
            const companyName = await db.collection('SystemSetting').findOne({ key: 'company_name' });
            const companyAddress = await db.collection('SystemSetting').findOne({ key: 'company_address' });

            await db.collection('Agreement').insertOne({
                agreementNo: 'AGR-2024-00001',
                sequence: 1,
                contractId: contract._id,
                customerId: contract.customerId,
                vehicleId: contract.vehicleId,
                status: 'GENERATED',
                data: {
                    company: {
                        name: companyName?.value || 'Rentix Demo',
                        address: companyAddress?.value || '123 Demo St, Colombo',
                    },
                    contractNo: contract.contractNo,
                    contractDate: { day: 1, month: 'January', year: 2024 },
                    term: { fromDate: '2024-01-01', toDate: '2024-01-08' },
                    secondParty: { name: 'John Doe', address: '123 Main St', nic: '123456789V' },
                    vehicle: { number: 'CAB-1234', brand: 'Toyota', model: 'Prius' }
                },
                createdAt: new Date(),
                updatedAt: new Date()
            });
            console.log('Demo Agreement created!');
        } else {
            console.log('Agreement already exists.');
        }

    } catch (err) {
        console.error('Failed to seed agreement:', err);
    } finally {
        await client.close();
    }
}

main();

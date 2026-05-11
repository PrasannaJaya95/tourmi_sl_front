const { MongoClient } = require('mongodb');

async function main() {
    const url = 'mongodb://localhost:27017';
    const dbName = 'rentix_moratuwa';
    const client = new MongoClient(url);

    try {
        await client.connect();
        const db = client.db(dbName);

        const settings = [
            { key: 'company_name', value: 'Rentix Moratuwa' },
            { key: 'company_address', value: 'No.420, Moratuwella, Moratuwa' },
            { key: 'company_contact_number', value: '+94 77 387 8078' },
            { key: 'company_email', value: 'info@rentixmoratuwa.lk' },
            { key: 'company_website', value: 'www.rentixmoratuwa.lk' }
        ];

        for (const s of settings) {
            await db.collection('SystemSetting').updateOne(
                { key: s.key },
                { $set: { value: s.value, updatedAt: new Date() } },
                { upsert: true }
            );
        }
        console.log('Local System Settings updated!');

    } catch (err) {
        console.error('Failed to seed settings:', err);
    } finally {
        await client.close();
    }
}

main();

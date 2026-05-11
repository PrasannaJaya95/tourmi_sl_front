const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

async function fixQuotations() {
    const uri = process.env.DATABASE_URL.split('?')[0];
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const dbName = process.env.DATABASE_URL.split('/').pop().split('?')[0];
        const db = client.db(dbName);
        const collection = db.collection('Quotation');

        console.log('Finding quotations with old field names...');
        const cursor = collection.find({ quotationNo: { $exists: true } });
        const docs = await cursor.toArray();
        console.log(`Found ${docs.length} documents to fix.`);

        for (const doc of docs) {
            const update = {
                $set: {
                    quotation_no: doc.quotationNo,
                    issue_date: doc.issueDate,
                    valid_until: doc.validUntil,
                    customer_mode: doc.customerMode,
                    customer_id: doc.customerId ? new ObjectId(doc.customerId) : null,
                    customer_name: doc.customerName,
                    customer_email: doc.customerEmail,
                    customer_type: doc.customerType,
                    vehicle_id: doc.vehicleId ? new ObjectId(doc.vehicleId) : null,
                    pickup_date: doc.pickupDate,
                    dropoff_date: doc.dropoffDate,
                    rental_days: doc.rentalDays,
                    daily_rate: doc.dailyRate,
                    base_amount: doc.baseAmount,
                    extra_charges_json: doc.extraChargesJson,
                    extra_amount: doc.extraAmount,
                    total_amount: doc.totalAmount,
                    security_deposit: doc.securityDeposit,
                    share_token: doc.shareToken,
                    created_by_user_id: doc.createdByUserId ? new ObjectId(doc.createdByUserId) : null,
                    created_at: doc.createdAt,
                    updated_at: doc.updatedAt
                },
                $unset: {
                    quotationNo: "",
                    issueDate: "",
                    validUntil: "",
                    customerMode: "",
                    customerId: "",
                    customerName: "",
                    customerEmail: "",
                    customerType: "",
                    vehicleId: "",
                    pickupDate: "",
                    dropoffDate: "",
                    rentalDays: "",
                    dailyRate: "",
                    baseAmount: "",
                    extraChargesJson: "",
                    extraAmount: "",
                    totalAmount: "",
                    securityDeposit: "",
                    shareToken: "",
                    createdByUserId: "",
                    createdAt: "",
                    updatedAt: ""
                }
            };

            await collection.updateOne({ _id: doc._id }, update);
            console.log(`Fixed document ${doc._id}`);
        }

        console.log('Done!');
    } catch (err) {
        console.error(err);
    } finally {
        await client.close();
    }
}

fixQuotations();

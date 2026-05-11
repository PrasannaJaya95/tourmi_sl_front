const { MongoClient } = require('mongodb');

async function fix() {
    const uri = "mongodb://127.0.0.1:27017/?directConnection=true";
    const client = new MongoClient(uri);
    try {
        await client.connect();
        console.log("Connected to MongoDB...");
        
        const admin = client.db('admin');
        try {
            const status = await admin.command({ replSetGetStatus: 1 });
            console.log("Replica set is already configured and active.");
            return;
        } catch (e) {
            console.log("Replica set not configured. Attempting to initiate...");
        }

        // Try to initiate
        try {
            await admin.command({ replSetInitiate: {} });
            console.log("Replica set initiated successfully! Your app should work now.");
        } catch (e) {
            console.error("Failed to initiate: ", e.message);
            console.log("\n--- ACTION REQUIRED ---");
            console.log("Your MongoDB is not running with the --replSet flag.");
            console.log("Please restart your MongoDB with this command:");
            console.log("mongod --dbpath <your_data_path> --replSet rs0");
        }
    } finally {
        await client.close();
    }
}

fix().catch(console.dir);

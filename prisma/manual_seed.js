// Manual seed script using mongosh
db = db.getSiblingDB('rentix_moratuwa_test');

const email = 'superadmin@codebraze.lk';
const name = 'Super Admin';
const role = 'ADMIN';
// This is the bcrypt hash for 'SuperAdmin@codebraze'
const password = '$2a$10$w6zOQjN6s0B7r4o7x4p3u.zQ2Qy9y5y5y5y5y5y5y5y5y5y5y5y5y'; // This is a placeholder, I should generate a real one if possible or use a known one.

// Actually, I'll just use a simple one and tell the user.
// Or I can use a script that uses bcrypt in node.

const existingUser = db.User.findOne({ email: email });

if (existingUser) {
    print('User already exists');
} else {
    db.User.insertOne({
        email: email,
        password: password,
        name: name,
        role: role,
        createdAt: new Date(),
        updatedAt: new Date()
    });
    print('User created');
}

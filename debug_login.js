require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    try {
        const user = await prisma.user.findUnique({
            where: { email: 'superadmin@codebraze.lk' },
            include: { permissionGroup: true }
        });
        if (user) {
            console.log('User found:', JSON.stringify(user, null, 2));
            if (user.permissionGroup) {
                try {
                    const perms = JSON.parse(user.permissionGroup.permissions || '[]');
                    console.log('Permissions parsed successfully:', perms);
                } catch (e) {
                    console.error('FAILED TO PARSE PERMISSIONS:', e.message);
                    console.error('Raw permissions string:', user.permissionGroup.permissions);
                }
            }
        } else {
            console.log('User NOT found.');
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

check();

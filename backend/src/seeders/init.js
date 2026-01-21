const bcrypt = require('bcryptjs');
const User = require('../models/User');

const seedAdminUser = async () => {
    try {
        const adminExists = await User.findOne({ where: { username: 'admin' } });

        if (!adminExists) {
            console.log('Seeding default admin user...');
            const hashedPassword = await bcrypt.hash('password123', 10);
            await User.create({
                username: 'admin',
                password: hashedPassword
            });
            console.log('Default admin user created: admin / password123');
        } else {
            console.log('Admin user already exists.');
        }
    } catch (error) {
        console.error('Error seeding admin user:', error);
    }
};

module.exports = seedAdminUser;

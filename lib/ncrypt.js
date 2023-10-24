const bcrypt = require('bcrypt');

const saltRounds = 10; // The number of salt rounds determines the computational cost (higher is slower but more secure).

// Function to hash a password
async function hashPassword(plainPassword) {
    try {
        const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);
        return hashedPassword;
    } catch (error) {
        throw error;
    }
}

// Function to verify a password
async function verifyPassword(plainPassword, hashedPassword) {
    try {
        const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
        return isMatch;
    } catch (error) {
        throw error;
    }
}

module.exports = {
    hashPassword,
    verifyPassword,
};

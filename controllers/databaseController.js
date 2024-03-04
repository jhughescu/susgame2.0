const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection URI
const uri = process.env.MONGODB_URI;

// Connect to MongoDBasync function dbConnect() {
async function dbConnect() {
    try {
        // Check if MongoDB URI is provided
        if (!uri) {
            console.warn('MongoDB URI not provided. Database functionality will not work.');
            return;
        }
        const isOnline = await checkInternetConnectivity();
        if (!isOnline) {
            console.warn('No internet connection. Database functionality will not work.');
        }
        await mongoose.connect(uri);
        console.log('DB connected');
    } catch (err) {
        console.error('Error connecting to MongoDB:', err);
    }
}
// Function to check internet connectivity
async function checkInternetConnectivity() {
    try {
        await require('dns').promises.resolve('www.google.com');
        return true; // Internet connection is available
    } catch (error) {
        return false; // Internet connection is not available
    }
}

const dbConnected = () => {
    let dbc = false;
    if (dbInstance && dbInstance.readyState === 1) {
        console.log('Database connection is active');
        dbc = true;
    } else {
        console.log('Database connection is not active');
        //        return false;
    }
    return dbc;
};


module.exports = { dbConnect };

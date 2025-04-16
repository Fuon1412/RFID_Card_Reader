require('dotenv').config();
const admin = require("firebase-admin");
const serviceAccount = require("./service_account.json");
const databaseURL = process.env.DATABASE_URL;

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: databaseURL
});

const db = admin.database();

module.exports = db;

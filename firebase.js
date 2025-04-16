const admin = require("firebase-admin");

const serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG); // Ambil dari environment variable

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;

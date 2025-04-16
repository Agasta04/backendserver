const admin = require("firebase-admin");
const serviceAccount = require("./firebase-service-account.json"); // ganti path sesuai lokasi file

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;

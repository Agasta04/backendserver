const db = require("../config/db");
const bcrypt = require("bcryptjs");

exports.login = async (req, res) => {
  console.log("Login request received:", req.body);

  const { username, password, role } = req.body;
  if (!username || !password || !role) {
    return res.status(400).send({ message: "Data login tidak lengkap." });
  }

  let query = "";
  let userRole = role.toLowerCase();
  if (userRole === "ustadz") {
    query =
      "SELECT id_ustadz, nama_ustadz AS nama, password FROM ustadz WHERE nama_ustadz = ?";
  } else if (userRole === "santri") {
    query =
      "SELECT id_santri, nama_santri AS nama, password FROM santri WHERE nama_santri = ?";
  } else if (userRole === "admin") {
    query =
      "SELECT id_admin, nama_admin AS nama, password FROM admin WHERE nama_admin = ?";
  } else {
    return res.status(400).send({ message: "Role tidak valid." });
  }

  db.query(query, [username], async (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).send({ message: "Terjadi kesalahan server." });
    }

    if (results.length === 0) {
      console.log("User not found:", username);
      return res.status(401).send({ message: "Username atau password salah." });
    }

    const user = results[0];
    console.log("User found:", user);

    try {
      // ✅ Debugging: Cek password di database
      console.log("Password dari database:", user.password);

      // ✅ Pastikan perbandingan password menggunakan bcryptjs
      const match = await bcrypt.compare(password, user.password); // Sebelumnya `bcryptjs.compare`

      if (!match) {
        console.log("Password mismatch for user:", username);
        return res
          .status(401)
          .send({ message: "Username atau password salah." });
      }

      delete user.password;
      console.log("Login berhasil:", user);

      res.status(200).send({
        message: "Login berhasil",
        role: userRole,
        user,
      });
    } catch (bcryptError) {
      console.error("Bcrypt error:", bcryptError);
      return res.status(500).send({
        message: "Terjadi kesalahan server saat verifikasi password.",
      });
    }
  });
};

const express = require("express");
const router = express.Router();
const loginController = require("../controllers/login.controller");

// Login route
router.post("/autentication", loginController.login);

module.exports = router;

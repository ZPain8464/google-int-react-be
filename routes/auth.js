const express = require('express');

const { login, signup, googleauth } = require("../controllers/auth");

const router = express.Router();

router.post('/login', login);
router.post('/signup', signup);
router.post('/googleauth', googleauth); 

module.exports = router;
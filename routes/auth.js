const express = require('express');

const { login, googleauth, handlewebhook } = require("../controllers/auth");

const router = express.Router();

router.post('/login', login);
router.post('/googleauth', googleauth); 
router.post('/handlewebhook', handlewebhook)

module.exports = router;
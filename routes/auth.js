const express = require('express');

const { login, signup, googleauth, gCalHandler } = require("../controllers/auth");

const router = express.Router();

router.post('/login', login);
router.post('/signup', signup);
router.post('/googleauth', googleauth); 
router.post('/gcal', gCalHandler);

module.exports = router;
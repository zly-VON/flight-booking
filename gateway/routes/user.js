// services/authService.js
const axios = require('axios');
const express = require('express');
const router = express.Router();

const SERVICE_1_URL = 'http://user_service:5000'; 

router.post('/register', async (req, res) => {
    try {
        const response = await axios.post(`${SERVICE_1_URL}/register`, req.body);
        res.status(response.status).json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).send(error.response?.data || { message: 'Server error' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const response = await axios.post(`${SERVICE_1_URL}/login`, req.body);
        res.status(response.status).json(response.data);
    } catch (error) {
        console.error('Error occurred:', error);
        res.status(error.response?.status || 500).json({ message: error.response?.data?.message || 'Server error' });
    }
});

module.exports = router;
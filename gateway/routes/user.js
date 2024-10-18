// services/user.js
const axios = require('axios');
const express = require('express');
const router = express.Router();
const { getNextServiceUrl } = require('../serviceDiscovery');


router.get('/home', async (req, res) => {
        try {
            const SERVICE_1_URL = getNextServiceUrl('user_service');
            const response = await axios.get(`${SERVICE_1_URL}/`);
            res.status(response.status).json(response.data);
        } catch (error) {
            console.error('Error occurred:', error);
            res.status(error.response?.status || 500).send(error.response?.data || { message: 'Server error' });
        }
    });

router.post('/register', async (req, res) => {
    try {
        const SERVICE_1_URL = getNextServiceUrl('user_service');
        const response = await axios.post(`${SERVICE_1_URL}/register`, req.body);
        res.status(response.status).json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).send(error.response?.data || { message: 'Server error' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const SERVICE_1_URL = getNextServiceUrl('user_service');
        const response = await axios.post(`${SERVICE_1_URL}/login`, req.body);
        res.status(response.status).json(response.data);
    } catch (error) {
        console.error('Error occurred:', error);
        res.status(error.response?.status || 500).json({ message: error.response?.data?.message || 'Server error' });
    }
});

router.get('/user-subscriptions/:userId', async (req, res) => {
    try {
        const id = req.params.userId; 
        const SERVICE_1_URL = getNextServiceUrl('user_service');
        const response = await axios.get(`${SERVICE_1_URL}/user-subscriptions/${id}`);
        res.status(response.status).json(response.data);
    } catch (error) {
        console.error('Error occurred:', error);
        res.status(error.response?.status || 500).json({ message: error.response?.data?.message || 'Server error' });
    }
});

module.exports = router;
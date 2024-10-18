// gateway/user.js
const axios = require('axios');
const express = require('express');
const router = express.Router();
const { getNextServiceUrl } = require('../serviceDiscovery');
const { withCircuitBreaker } = require('../circuitBreaker');


router.get('/home', async (req, res) => {
    const serviceName = 'user_service';
    try {
        const { instanceName, url: SERVICE_1_URL } = getNextServiceUrl(serviceName);
        const response = await withCircuitBreaker(instanceName, async () => {
            return await axios.get(`${SERVICE_1_URL}/`);
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        console.error('Error occurred:', error);
        res.status(error.response?.status || 500).send(error.response?.data || { message: 'Server error' });
    }
});


router.get('/simulate-failure', async (req, res) => {
    const serviceName = 'user_service_1';
    try {
        const SERVICE_1_URL = `http://user_service_1:5000`
        const response = await withCircuitBreaker(serviceName, async () => {
            return await axios.get(`${SERVICE_1_URL}/simulate-failure`);
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'An unknown error occurred';
        console.error('Error occurred:', errorMessage);
        res.status(error.response?.status || 500).send({ message: errorMessage });
    }
});

router.post('/register', async (req, res) => {
    const serviceName = 'user_service';
    try {
        const { instanceName, url: SERVICE_1_URL } = getNextServiceUrl(serviceName);
        const response = await withCircuitBreaker(instanceName, async () => {
            return await axios.post(`${SERVICE_1_URL}/register`, req.body);
        });

        res.status(response.status).json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).send(error.response?.data || { message: 'Server error' });
    }
});

router.post('/login', async (req, res) => {
    const serviceName = 'user_service';
    try {
        const { instanceName, url: SERVICE_1_URL } = getNextServiceUrl(serviceName);
        const response = await withCircuitBreaker(instanceName, async () => {
            return await axios.post(`${SERVICE_1_URL}/login`, req.body);
        });
        
        res.status(response.status).json(response.data);
    } catch (error) {
        console.error('Error occurred:', error);
        res.status(error.response?.status || 500).json({ message: error.response?.data?.message || 'Server error' });
    }
});

router.get('/user-subscriptions/:userId', async (req, res) => {
    const serviceName = 'user_service';
    try {
        const id = req.params.userId;
        const { instanceName, url: SERVICE_1_URL } = getNextServiceUrl(serviceName);
        const response = await withCircuitBreaker(instanceName, async () => {
            return await axios.get(`${SERVICE_1_URL}/user-subscriptions/${id}`);
        });

        res.status(response.status).json(response.data);
    } catch (error) {
        console.error('Error occurred:', error);
        res.status(error.response?.status || 500).json({ message: error.response?.data?.message || 'Server error' });
    }
});

module.exports = router;
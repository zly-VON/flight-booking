// gateway/user.js
const axios = require('axios');
const express = require('express');
const router = express.Router();
const { getNextServiceUrl } = require('../serviceDiscovery');
const { withCircuitBreaker } = require('../circuitBreaker');

const serviceName = 'user_service';

router.get('/home', async (req, res) => {
    try {
        const response = await withCircuitBreaker(serviceName, async (url) => {
            return await axios.get(`${url}/`);
        });

        res.status(response.status).json(response.data);
    } catch (error) {
        console.error('Error occurred:', error);
        res.status(error.response?.status || 500).send(error.response?.data || { message: 'Server error' });
    }
});


router.get('/simulate-failure', async (req, res) => {
    try {
        const response = await withCircuitBreaker(serviceName, async (url) => {
            return await axios.get(`${url}/simulate-failure`);
        });
        
        res.status(response.status).json(response.data);
    } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'An unknown error occurred';
        res.status(error.response?.status || 500).send({ message: errorMessage });
    }
});


router.post('/register', async (req, res) => {
    try {
        const response = await withCircuitBreaker(serviceName, async (url) => {
            return await axios.post(`${url}/register`, req.body);
        });
        
        res.status(response.status).json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).send(error.response?.data || { message: 'Server error' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const response = await withCircuitBreaker(serviceName, async (url) => {
            return await axios.post(`${url}/login`, req.body);
        });
        
        res.status(response.status).json(response.data);
    } catch (error) {
        console.error('Error occurred:', error);
        res.status(error.response?.status || 500).json({ message: error.response?.data?.message || 'Server error' });
    }
});

router.get('/user-subscriptions/:userId', async (req, res) => {
    try {
        const id = req.params.userId;
        const response = await withCircuitBreaker(serviceName, async (url) => {
            return await axios.get(`${url}/user-subscriptions/${id}`);
        });

        res.status(response.status).json(response.data);
    } catch (error) {
        console.error('Error occurred:', error);
        res.status(error.response?.status || 500).json({ message: error.response?.data?.message || 'Server error' });
    }
});

module.exports = router;
const axios = require('axios');
const express = require('express');
const router = express.Router();
const { getNextServiceUrl } = require('../serviceDiscovery');
const { withCircuitBreaker } = require('../circuitBreaker');


router.get('/search-flights', async (req, res) => {
    const serviceName = 'booking_service';
    try {
        const {from, to} = req.query;

        const { instanceName, url: SERVICE_2_URL } = getNextServiceUrl(serviceName);
        const response = await withCircuitBreaker(instanceName, async () => {
            return await axios.get(`${SERVICE_2_URL}/search-flights`, {
                params: {from, to}});
        });

        res.status(response.status).json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).send(error.response?.data || { message: 'Server error' });
    }
});

router.post('/book-flight', async (req, res) => {
    const serviceName = 'booking_service';
    try {
        const { instanceName, url: SERVICE_2_URL } = getNextServiceUrl(serviceName);
        const response = await withCircuitBreaker(instanceName, async () => {
            return await axios.post(`${SERVICE_2_URL}/book-flight`, req.body, {
                headers: { Authorization: req.headers.authorization }});
        });

        res.status(response.status).json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).send(error.response?.data || { message: 'Server error' });
    }
});

router.get('/bookings/:userId', async (req, res) => {
    const serviceName = 'booking_service';
    try {
        const id = req.params.userId; 
        const { instanceName, url: SERVICE_2_URL } = getNextServiceUrl(serviceName);
        const response = await withCircuitBreaker(instanceName, async () => {
            return await axios.get(`${SERVICE_2_URL}/bookings/${id}`, {
                headers: { Authorization: req.headers.authorization }});
        });

        res.status(response.status).json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).send(error.response?.data || { message: 'Server error' });
    }
});

router.delete('/cancel-booking/:bookingId', async (req, res) => {
    const serviceName = 'booking_service';
    try {
        const id = req.params.bookingId; 
        const { instanceName, url: SERVICE_2_URL } = getNextServiceUrl(serviceName);
        const response = await withCircuitBreaker(instanceName, async () => {
            return await axios.delete(`${SERVICE_2_URL}/cancel-booking/${id}`, {
                headers: { Authorization: req.headers.authorization }});
        });

        res.status(response.status).json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).send(error.response?.data || { message: 'Server error' });
    }
});

router.post('/seed', async (req, res) => {
    const serviceName = 'booking_service';
    try {
        const { instanceName, url: SERVICE_2_URL } = getNextServiceUrl(serviceName);
        const response = await withCircuitBreaker(instanceName, async () => {
            return await axios.post(`${SERVICE_2_URL}/seed`);
        });

        res.status(response.status).json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).send(error.response?.data || { message: 'Server error' });
    }
});

module.exports = router
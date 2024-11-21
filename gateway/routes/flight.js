const axios = require('axios');
const express = require('express');
const router = express.Router();
const { withCircuitBreaker } = require('../circuitBreaker');

const serviceName = 'booking_service';

router.get('/seed', async (req, res) => {
    try {
        const response = await withCircuitBreaker(serviceName, async (url) => {
            return await axios.get(`${url}/seed`);
        });

        res.status(response.status).json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).send(error.response?.data || { message: 'Server error' });
    }
});

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

router.get('/search-flights', async (req, res) => {
    try {
        const {from, to} = req.query;
        const response = await withCircuitBreaker(serviceName, async (url) => {
            return await axios.get(`${url}/search-flights`, {
                params: {from, to}});
        });

        res.status(response.status).json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).send(error.response?.data || { message: 'Server error' });
    }
});

router.post('/book-flight', async (req, res) => {
    try {
        const response = await withCircuitBreaker(serviceName, async (url) => {
            return await axios.post(`${url}/book-flight`, req.body, {
                headers: { Authorization: req.headers.authorization }});
        });

        res.status(response.status).json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).send(error.response?.data || { message: 'Server error' });
    }
});

router.get('/bookings/:userId', async (req, res) => {
    try {
        const id = req.params.userId; 
        const response = await withCircuitBreaker(serviceName, async (url) => {
            return await axios.get(`${url}/bookings/${id}`, {
                headers: { Authorization: req.headers.authorization }});
        });

        res.status(response.status).json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).send(error.response?.data || { message: 'Server error' });
    }
});

router.delete('/cancel-booking/:bookingId', async (req, res) => {
    try {
        const id = req.params.bookingId;
        const response = await withCircuitBreaker(serviceName, async (url) => {
            return await axios.delete(`${url}/cancel-booking/${id}`, {
                headers: { Authorization: req.headers.authorization }});
        });

        res.status(response.status).json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).send(error.response?.data || { message: 'Server error' });
    }
});

module.exports = router
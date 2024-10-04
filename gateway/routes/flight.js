const axios = require('axios');
const express = require('express');
const router = express.Router();

const SERVICE_2_URL = 'http://booking_service:5001';

router.get('/search-flights', async (req, res) => {
    try {
        const {from, to} = req.query;
        const response = await axios.get(`${SERVICE_2_URL}/search-flights`, {
            params: {from, to}
    });
        res.status(response.status).json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).send(error.response?.data || { message: 'Server error' });
    }
});

router.post('/book-flight', async (req, res) => {
    try {
        const response = await axios.post(`${SERVICE_2_URL}/book-flight`, req.body, {
            headers: { Authorization: req.headers.authorization }
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).send(error.response?.data || { message: 'Server error' });
    }
});

router.get('/bookings/:userId', async (req, res) => {
    try {
        const id = req.params.userId; 
        const response = await axios.get(`${SERVICE_2_URL}/bookings/${id}`, {
            headers: { Authorization: req.headers.authorization }
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).send(error.response?.data || { message: 'Server error' });
    }
});

router.delete('/cancel-booking/:bookingId', async (req, res) => {
    try {
        const id = req.params.bookingId; 
        const response = await axios.delete(`${SERVICE_2_URL}/cancel-booking/${id}`, {
            headers: { Authorization: req.headers.authorization }
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).send(error.response?.data || { message: 'Server error' });
    }
});

module.exports = router
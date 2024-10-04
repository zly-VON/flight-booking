const express = require('express');
const axios = require('axios');
const userRoutes = require('./routes/user');
const flightRoutes = require('./routes/flight');

const app = express();
const PORT = process.env.PORT || 4000;

const TIMEOUT = 5000;

const timeout = (req, res, next) => {
    res.setTimeout(TIMEOUT, () => {
        if (!res.headersSent) {
            res.status(408).send({ message: 'Request timeout' });
        }
    });
    next();
};

app.use(express.json());
app.use(timeout);

app.get('/test-timeout', (req, res) => {
    const delay = req.query.delay ? parseInt(req.query.delay) : 6000;

    setTimeout(() => {
    }, delay);
});

app.use('/api/auth', userRoutes);
app.use('/api/flight', flightRoutes);

app.listen(PORT, () => {
    console.log("Gateway running on port 4000");
});
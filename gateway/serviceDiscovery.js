const express = require('express');
const router = express.Router();

const services = {};

const registerService = (serviceName, serviceUrl) => {
    if (!serviceName || !serviceUrl) {
        console.error('Service name and URL are required for registration.');
        return;
    }
    
    if (!services[serviceName]) {
        services[serviceName] = [];
    }

    const instanceName = serviceUrl.split('/')[2].split(':')[0];
    services[serviceName].push({ url: serviceUrl, instance: instanceName });

    console.log(`Service registered: ${serviceName} at ${serviceUrl} (Instance: ${instanceName})`);
};

router.get('/services', (req, res) => {
    return res.status(200).json(services);
});

router.get('/status', (req, res) => {
    return res.status(200).json({ status: 'Service Discovery is running', services });
});

registerService('user_service', 'http://user_service_1:5000');
registerService('user_service', 'http://user_service_2:5000');
registerService('user_service', 'http://user_service_3:5000');

registerService('booking_service', 'http://booking_service_1:5004');
registerService('booking_service', 'http://booking_service_2:5004');
registerService('booking_service', 'http://booking_service_3:5004');


const serviceIndices = {
    'user_service': 0,
    'booking_service': 0
};


// round robin
const getNextServiceUrl = (serviceName) => {
    if (!services[serviceName] || services[serviceName].length === 0) {
        throw new Error(`Service ${serviceName} not found or has no registered instances`);
    }

    const urls = services[serviceName];
    const index = serviceIndices[serviceName];

    const { url: nextUrl, instance } = urls[index];
    serviceIndices[serviceName] = (index + 1) % urls.length;

    console.log(`Routing request to ${instance} at ${nextUrl}.`);

    return { instanceName: instance, url: nextUrl }; 
};


module.exports = {
    router,
    getNextServiceUrl
};

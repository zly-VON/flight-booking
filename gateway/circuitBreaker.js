const TIMEOUT = 5000;
const ERROR_THRESHOLD = 3;
const WINDOW_TIME = TIMEOUT * 3.5;
const COOLDOWN_TIME = 10000;

const serviceErrorCounts = {}; 
const serviceTimestamps = {}; 
const serviceBlocked = {}; 


const checkCircuitBreaker = (serviceName) => {
    const currentTime = Date.now();
    
    if (serviceBlocked[serviceName]) {
        const timeSinceBlock = currentTime - serviceTimestamps[serviceName];
        if (timeSinceBlock < COOLDOWN_TIME) {
            console.log(`Service ${serviceName} is blocked. Retry after cooldown.`);
            return true; 
        } else {
            console.log(`Cooldown period ended. Retrying service ${serviceName}.`);
            serviceErrorCounts[serviceName] = 0;
            serviceBlocked[serviceName] = false;
        }
    }
    
    return false; 
};

const recordServiceError = (serviceName) => {
    const currentTime = Date.now();
    
    if (!serviceErrorCounts[serviceName]) {
        serviceErrorCounts[serviceName] = 0;
        serviceTimestamps[serviceName] = currentTime;
    }

    serviceErrorCounts[serviceName] += 1;
    const timeSinceFirstError = currentTime - serviceTimestamps[serviceName];
    
    if (serviceErrorCounts[serviceName] >= ERROR_THRESHOLD && timeSinceFirstError <= WINDOW_TIME) {
        console.log(`Circuit breaker tripped for ${serviceName}`);
        serviceBlocked[serviceName] = true;
        serviceTimestamps[serviceName] = currentTime;
    } else if (timeSinceFirstError > WINDOW_TIME) {
        serviceErrorCounts[serviceName] = 1;
        serviceTimestamps[serviceName] = currentTime;
    }
};

const withCircuitBreaker = async (serviceName, requestFunc) => {
    if (checkCircuitBreaker(serviceName)) {
        return { status: 503, data: { message: `${serviceName} is temporarily unavailable due to failures.` } };
    }

    try {
        const result = await requestFunc();
        return result;
    } catch (error) {
        console.error(`Error occurred while contacting ${serviceName}:`, error.message);
        recordServiceError(serviceName);
        throw error;
    }
};


module.exports = { withCircuitBreaker };

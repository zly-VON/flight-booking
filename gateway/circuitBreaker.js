const { getNextServiceUrl } = require('./serviceDiscovery');

const MAX_REROUTES = 3;
const MAX_ATTEMPTS = 3;
const SERVICE_BLOCK_TIME = 10000;

const serviceFailures = {};
const serviceBlocked = {};

const tryServiceInstances = async (serviceName, requestFunc) => {
    let reroutes = 0; // Reroute counter

    while (reroutes < MAX_REROUTES) {
        const { instanceName, url: instanceUrl } = getNextServiceUrl(serviceName);

        let attempts = 0;

        while (attempts < MAX_ATTEMPTS) {
            console.log(`Attempt ${attempts + 1}: Instance ${instanceName} at ${instanceUrl}`);

            try {
                const result = await requestFunc(instanceUrl);
                return result;
            } catch (error) {
                console.error(`Error ${attempts + 1}: Instance ${instanceName}: ${error.message}`);

                if (error.status !== 500) {
                    return { status: error.response?.status, data: { message: error.response?.data?.message } };
                }

                attempts++;

                // Move to the next instance
                if (attempts >= MAX_ATTEMPTS) {
                    console.log(`Instance ${instanceName} failed ${MAX_ATTEMPTS} times. Routing...`);
                    reroutes++;
                    break;
                }
            }
        }

        // Block the service temporarily
        if (reroutes >= MAX_REROUTES) {
            console.log(`Service ${serviceName} failed after ${MAX_REROUTES} reroutes.`);
            serviceBlocked[serviceName] = true;
            serviceFailures[serviceName] = Date.now();
            throw new Error(`Service ${serviceName} is temporarily unavailable due to failures.`);
        }
    }
};

const withCircuitBreaker = async (serviceName, requestFunc) => {
    // Check if service is blocked
    if (serviceBlocked[serviceName]) {
        const currentTime = Date.now();
        const timeSinceBlock = currentTime - serviceFailures[serviceName];
        if (timeSinceBlock < SERVICE_BLOCK_TIME) {
            console.log(`Service ${serviceName} is blocked due to multiple failures. Retry after cooldown.`);
            return { status: 503, data: { message: `${serviceName} is temporarily unavailable due to failures.` } };
        } else {
            // Unblock the service after cooldown
            console.log(`Cooldown period ended for ${serviceName}. Retrying service.`);
            serviceBlocked[serviceName] = false;
            serviceFailures[serviceName] = 0;
        }
    }

    try {
        return await tryServiceInstances(serviceName, requestFunc);
    } catch (error) {
        if (error.status === 500) {
            console.error(`Circuit Breaker tripped for ${serviceName}:`, error.message);
            return { status: 503, data: { message: `${serviceName} is temporarily unavailable after multiple failures.` } };
        }

        return { status: error.response?.status, data: { message: error.response?.data?.message } };
    }
};

module.exports = { withCircuitBreaker };

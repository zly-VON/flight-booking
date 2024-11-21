const { getNextServiceUrl } = require('./serviceDiscovery');

const MAX_REROUTES = 3; // Maximum number of reroutes allowed
const MAX_ATTEMPTS = 3;  // Maximum attempts per instance
const SERVICE_BLOCK_TIME = 10000;  // Temporary block time (10 seconds)

const serviceFailures = {};  // Track failures across all instances
const serviceBlocked = {};  // Track if a service is blocked

// Function to handle retries and rerouting using getNextInstanceUrl
const tryServiceInstances = async (serviceName, requestFunc) => {
    let reroutes = 0;  // Reroute counter

    // Loop for rerouting (up to MAX_REROUTES)
    while (reroutes < MAX_REROUTES) {
        // Get the next instance URL dynamically using getNextInstanceUrl
        const { instanceName, url: instanceUrl } = getNextServiceUrl(serviceName);

        // console.log(`Routing request to ${instanceName} at ${instanceUrl}`);

        let attempts = 0;  // Attempts counter for each instance

        // Retry up to MAX_ATTEMPTS for the current instance
        while (attempts < MAX_ATTEMPTS) {
            console.log(`Attempt ${attempts + 1}: Instance ${instanceName} at ${instanceUrl}`);

            try {
                // Call the request function for the current instance
                const result = await requestFunc(instanceUrl);
                return result;  // Success, return the result
            } catch (error) {
                console.error(`Error ${attempts + 1}: Instance ${instanceName}: ${error.message}`);
                attempts++;

                // If all attempts for this instance fail, move to the next instance
                if (attempts >= MAX_ATTEMPTS) {
                    console.log(`Instance ${instanceName} failed ${MAX_ATTEMPTS} times. Routing...`);
                    reroutes++;  // Increment reroutes counter
                    break;  // Exit inner retry loop, go to next instance
                }
            }
        }

        // If we have already tried all reroutes, stop retrying
        if (reroutes >= MAX_REROUTES) {
            console.log(`Service ${serviceName} failed after ${MAX_REROUTES} reroutes.`);
            serviceBlocked[serviceName] = true;
            serviceFailures[serviceName] = Date.now();  // Mark the time of blocking
            throw new Error(`Service ${serviceName} is temporarily unavailable due to failures.`);
        }
    }
};

// Wrapper to handle the circuit breaker logic
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
            serviceFailures[serviceName] = 0;  // Reset the failure count
        }
    }

    // Try the service instances with retries and reroutes
    try {
        return await tryServiceInstances(serviceName, requestFunc);
    } catch (error) {
        console.error(`Circuit Breaker tripped for ${serviceName}:`, error.message);
        return { status: 503, data: { message: `${serviceName} is temporarily unavailable after multiple failures.` } };
    }
};

module.exports = { withCircuitBreaker };

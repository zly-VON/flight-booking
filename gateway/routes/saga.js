const axios = require("axios");
const express = require("express");
const router = express.Router();
const { getNextServiceUrl } = require("../serviceDiscovery");

let sagaStates = {};

router.post("/flight-booking", async (req, res) => {
    const { userId, flightId, paymentMethod, credit } = req.body;
    const sagaId = Date.now().toString();
    sagaStates[sagaId] = { status: "STARTED", steps: [] };

    let bookingId = null;
    let creditsDeducted = false;

    try {
        console.log(`[Saga ${sagaId}] Step 1: Deduct credits - Start`);
        sagaStates[sagaId].steps.push({
            step: "Deduct credits",
            status: "PENDING",
        });
        const { url: SERVICE_1_URL } = getNextServiceUrl("user_service");
        await axios.patch(`${SERVICE_1_URL}/deduct-credits/${userId}`, { credit });
        sagaStates[sagaId].steps[0].status = "SUCCESS";
        creditsDeducted = true;
        console.log(`[Saga ${sagaId}] Step 1: Deduct credits - Success`);

        console.log(`[Saga ${sagaId}] Step 2: Reserve seat - Start`);
        sagaStates[sagaId].steps.push({ step: "Reserve seat", status: "PENDING" });
        const { url: SERVICE_2_URL } = getNextServiceUrl("booking_service");
        const reserveSeatResponse = await axios.post(
            `${SERVICE_2_URL}/book-flight`,
            { flightId, paymentMethod },
            {
                headers: { Authorization: req.headers.authorization },
            }
        );
        sagaStates[sagaId].steps[1].status = "SUCCESS";
        console.log(`[Saga ${sagaId}] Step 2: Reserve seat - Success`);

        bookingId = reserveSeatResponse.data.bookingId;

        sagaStates[sagaId].status = "COMPLETED";
        console.log(`[Saga ${sagaId}] Saga completed successfully`);

        res
            .status(200)
            .json({ message: "Transaction completed successfully", sagaId });
    } catch (error) {
        console.error(`[Saga ${sagaId}] Saga failed:`, error.message);

        sagaStates[sagaId].status = "FAILED";
        console.log(`[Saga ${sagaId}] Saga status updated to FAILED`);

        const { url: SERVICE_1_URL } = getNextServiceUrl("user_service");
        const { url: SERVICE_2_URL } = getNextServiceUrl("booking_service");

        if (creditsDeducted) {
            console.log(`[Saga ${sagaId}] Rollback Step 1: Refund credits - Start`);
            await axios.patch(`${SERVICE_1_URL}/refund-credits/${userId}`, { credit });
            console.log(`[Saga ${sagaId}] Rollback Step 1: Refund credits - Success`);
        }

        if (bookingId) {
            console.log(`[Saga ${sagaId}] Rollback Step 2: Cancel booking - Start`);
            await axios.delete(`${SERVICE_2_URL}/cancel-booking/${bookingId}`, {
                headers: { Authorization: req.headers.authorization },
            });
            console.log(`[Saga ${sagaId}] Rollback Step 2: Cancel booking - Success`);
        }

        res
            .status(500)
            .json({ message: "Transaction failed and rolled back", sagaId });
    }
});

module.exports = router;

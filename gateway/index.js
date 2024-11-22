const express = require("express");
const axios = require("axios");
const client = require("prom-client");
const userRoutes = require("./routes/user");
const flightRoutes = require("./routes/flight");
const sagaRoutes = require("./routes/saga");
const { router: serviceDiscoveryRoutes } = require("./serviceDiscovery");

const app = express();
const PORT = process.env.PORT || 4000;
const TIMEOUT = 5000;

const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics();

const httpRequestsTotal = new client.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "status", "route"],
});

app.get("/metrics", async (req, res) => {
  try {
    res.set("Content-Type", client.register.contentType);
    res.end(await client.register.metrics());
  } catch (err) {
    res.status(500).send("Error generating metrics");
  }
});

const timeout = (req, res, next) => {
  res.setTimeout(TIMEOUT, () => {
    if (!res.headersSent) {
      res.status(408).send({ message: "Request timeout" });
    }
  });
  next();
};

app.use(express.json());
app.use(timeout);

app.use((req, res, next) => {
  res.on("finish", () => {
    httpRequestsTotal.inc({
      method: req.method,
      status: res.statusCode,
      route: req.originalUrl,
    });
  });
  next();
});

app.get("/gateway/status", (req, res) => {
  return res.status(200).json({
    status: "Gateway is running",
    port: PORT,
    uptime: process.uptime(),
  });
});

app.get("/test-timeout", (req, res) => {
  const delay = req.query.delay ? parseInt(req.query.delay) : 6000;

  setTimeout(() => {
    res.send("Response after delay");
  }, delay);
});

app.use("/api/discovery", serviceDiscoveryRoutes);
app.use("/api/auth", userRoutes);
app.use("/api/flight", flightRoutes);
app.use("/api/saga", sagaRoutes);

app.listen(PORT, () => {
  console.log("Gateway running on port 4000");
});

const { connect } = require("./src/config/db.config");
require("dotenv").config();
connect();
const express = require("express");
const http = require("http");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const compression = require("compression");
const { createLogger, transports, format } = require("winston");
const { initializeSocket } = require("./src/controllers/socketController");
const globalErrorHandler = require('./src/controllers/errorController');
const CustomError = require("./src/utils/customError");
const indexRouter = require("./src/routes/index.routes");
const path = require("path");
const session = require('express-session');

const hpp = require('hpp');

const app = express();
const server = http.createServer(app);

// const logger = createLogger({
//   level: "info",
//   format: format.combine(
//     format.timestamp(),
//     format.printf(
//       ({ timestamp, level, message }) => `${timestamp} [${level}]: ${message}`
//     )
//   ),
//   transports: [
//     new transports.Console(),
//     new transports.File({ filename: "server.log" }),
//   ],
// });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

initializeSocket(server);

app.use(helmet());
app.use(hpp())
app.use(compression());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(session({
  secret: 'yourSecretKey',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // true if using HTTPS
}));

// app.use(
//   morgan("combined", {
//     stream: { write: (message) => logger.info(message.trim()) },
//   })
// );

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests, please try again later.",
});
app.use(limiter);

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

app.use("/api/v1/", indexRouter);

// Handle unknown routes
app.all('/{*any}', (req, res, next) => {
  const err = new CustomError(`Can't find ${req.originalUrl} on this server!`, 404);
  next(err);
});



// Global error handling middleware
app.use(globalErrorHandler);

const shutdown = () => {
  console.log("Shutting down gracefully...");
  server.close(() => {
    console.log("Closed all connections");
    process.exit(0);
  });

  setTimeout(() => {
    console.error("Forcing shutdown...");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

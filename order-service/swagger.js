const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Order Service API",
      version: "1.0.0",
      description: "Documentation for Order Service API",
    },
  },
  apis: ["./src/routes/orderRoutes.js"],
};

const specs = swaggerJsdoc(options);

module.exports = { specs, swaggerUi };

const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Order Service Stats API",
      version: "1.0.0",
      description: "Documentation for Order Service Stats API",
    },
    servers: [
      {
        url: "/api",
      },
    ],
  },
  apis: ["./routes/statsRoutes.js"],
};

const specs = swaggerJsdoc(options);

module.exports = { specs, swaggerUi };

const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Recommendation Service API",
      version: "1.0.0",
      description: "Documentation for Recommendation Service API",
    },
  },
  apis: ["./src/routes/recommendationRoutes.js"],
};

const specs = swaggerJsdoc(options);

module.exports = { specs, swaggerUi };

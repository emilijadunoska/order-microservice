const amqp = require("amqplib");

let rabbitMQChannel;
let rabbitMQConnection;

async function setupRabbitMQ(rabbitMQUrl, exchange, queue) {
    try {
        rabbitMQConnection = await amqp.connect(rabbitMQUrl);
        rabbitMQChannel = await rabbitMQConnection.createChannel();

        await rabbitMQChannel.assertExchange(exchange, "direct", { durable: true });
        await rabbitMQChannel.assertQueue(queue, { durable: true });
        await rabbitMQChannel.bindQueue(queue, exchange, "");
    } catch (error) {
        console.error("Error setting up RabbitMQ:", error);
        throw error;
    }
}

async function sendMessageToRabbitMQ(message) {
    try {
        await rabbitMQChannel.publish("rv1_sipia_4", "", Buffer.from(message));
        console.log("Message sent to RabbitMQ:", message);
    } catch (error) {
        console.error("Error sending message to RabbitMQ:", error);
        throw error;
    }
}

async function getMessageFromRabbitMQ() {
    try {
        const queue = "rv1_sipia_4";
        const { messageCount } = await rabbitMQChannel.checkQueue(queue);

        if (messageCount > 0) {
            const message = await rabbitMQChannel.get(queue);
            if (message) {
                await rabbitMQChannel.ack(message);
                return message.content.toString();
            }
        }

        return "No messages available";
    } catch (error) {
        console.error("Error getting message from RabbitMQ:", error);
        throw error;
    }
}

async function getAllMessagesFromRabbitMQ() {
    try {
        const queue = "rv1_sipia_4";
        const { messageCount } = await rabbitMQChannel.checkQueue(queue);

        if (messageCount > 0) {
            const messages = [];

            for (let i = 0; i < messageCount; i++) {
                const message = await rabbitMQChannel.get(queue);
                if (message) {
                    await rabbitMQChannel.ack(message);
                    messages.push(message.content.toString());
                }
            }

            return messages;
        }

        return ["No messages available"];
    } catch (error) {
        console.error("Error getting messages from RabbitMQ:", error);
        throw error;
    }
}

async function logEvent(logType, url, correlationId, applicationName, message) {
    try {
        const logEntry = {
            timestamp: new Date().toISOString(),
            logType,
            url,
            correlationId,
            applicationName,
            message,
        };

        const logMessage = JSON.stringify(logEntry);

        await rabbitMQChannel.publish("rv1_sipia_4", "", Buffer.from(logMessage));
    } catch (error) {
        console.error("Error logging event:", error);
    }
}

async function logEventMiddleware(
    req,
    res,
    next,
    successLogType,
    errorLogType
) {
    try {
        await logEvent(
            successLogType,
            req.originalUrl,
            req.correlationId,
            "Recommendation service",
            "Incoming request"
        );
        next();
    } catch (error) {
        await logEvent(
            errorLogType,
            req.originalUrl,
            req.correlationId,
            "Recommendation service",
            `Error: ${error.message}`
        );
        next(error);
    }
}

module.exports = {
    setupRabbitMQ,
    logEvent,
    sendMessageToRabbitMQ,
    getMessageFromRabbitMQ,
    getAllMessagesFromRabbitMQ,
    logEventMiddleware,
};

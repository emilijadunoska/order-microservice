const jwt = require("jsonwebtoken");
const secretKey = "sua_jwt-test";

const jwtAuthenticationRequired = (req, res, next) => {
    const token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({ error: "Missing access token" });
    }

    try {
        const payload = jwt.verify(token.split(" ")[1], secretKey);
        req.user_identity = payload;
        next();
    } catch (err) {
        return res.status(401).json({ error: "Invalid token" });
    }
};

module.exports = { jwtAuthenticationRequired };

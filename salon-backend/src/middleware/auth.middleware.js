import jwt from "jsonwebtoken";

export const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      message: "No token provided",
    });
  }

  try {
    // Use a regex to split by one or more whitespace characters
    const parts = authHeader.trim().split(/\s+/);

    if (parts.length !== 2 || parts[0] !== "Bearer") {
      console.error("Auth: Invalid header format", authHeader);
      return res.status(401).json({
        message: "token invalid",
      });
    }

    const token = parts[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.user = decoded;

    next();
  } catch (err) {
    console.error("JWT Verification failed:", err.message);
    const responseMessage =
      err.name === "TokenExpiredError"
        ? "token expired"
        : "token invalid";

    return res.status(401).json({
      message: responseMessage,
    });
  }
};
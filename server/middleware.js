import jwt from "jsonwebtoken";

export const protect = (req, res, next) => {
  // const token = req.headers["authorization"];
  // if (!token) return res.status(401).json({ msg: "No token provided" });

  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(401).json({ msg: "No token" });

  const token = authHeader.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : authHeader;
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ msg: "Invalid token" });
    req.user = decoded;
    next();
  });
};

import admin from "firebase-admin";
import { Request, Response, NextFunction } from "express";

export const verifyToken = async (req: any, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  console.log("Auth Header present:", !!authHeader);
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.warn("Unauthorized: Missing or invalid token format");
    return res.status(401).json({ error: "Unauthorized: Missing or invalid token" });
  }

  const idToken = authHeader.split("Bearer ")[1];
  console.log("Auth token extracted (length):", idToken?.length);
  
  if (!idToken || idToken.trim().length === 0 || idToken === "undefined" || idToken === "null" || idToken === "undef") {
      console.warn("Unauthorized: Token is missing or placeholder value:", idToken);
      return res.status(401).json({ error: "Unauthorized: Token is empty or invalid" });
  }

  try {
    // Check if token structure is roughly JWT (contains 2 dots / 3 segments)
    const segments = idToken.split(".");
    if (segments.length !== 3) {
      console.warn("Auth Error: Token is not a valid JWT. Segments:", segments.length);
      return res.status(401).json({ error: "Unauthorized: Token structure is invalid" });
    }
    
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error: any) {
    console.error("Auth Error: Decoding Firebase ID token failed.", {
        length: idToken.length, 
        prefix: idToken.substring(0, 10),
        message: error.message,
        code: error.code
    });
    res.status(403).json({ error: "Forbidden: Invalid token" });
  }
};

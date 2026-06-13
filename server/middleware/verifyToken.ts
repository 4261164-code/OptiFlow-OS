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
  
  if (!idToken || idToken.trim().length === 0) {
      console.warn("Unauthorized: Token is missing after 'Bearer '");
      return res.status(401).json({ error: "Unauthorized: Token is empty" });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error("Auth Error: Decoding Firebase ID token failed. Token length:", idToken.length, "Token prefix:", idToken.substring(0, 5), "Error:", error);
    res.status(403).json({ error: "Forbidden: Invalid token" });
  }
};

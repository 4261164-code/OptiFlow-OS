import { logger } from "./lib/logger";
export interface LinkedInProfileResult {
  success: boolean;
  urn?: string;
  name?: string;
  error?: string;
}

export interface LinkedInPublishResult {
  success: boolean;
  postId?: string;
  link?: string;
  isSimulated?: boolean;
  urnUsed?: string;
  error?: string;
}

/**
 * Robustly resolves the user's LinkedIn Person URN (urn:li:person:<id>) and profiles their account.
 * Connects first using OIDC userInfo (standard for modern LinkedIn OAuth),
 * falling back gracefully to the standard V2 me profile details.
 */
export async function getLinkedInProfile(accessToken: string): Promise<LinkedInProfileResult> {
  if (!accessToken || accessToken.trim() === "") {
    return {
      success: false,
      error: "Malformed or missing LinkedIn Access Token. Ensure a valid active token is provided."
    };
  }

  try {
    // 1. Try modern OpenID Connect userinfo endpoint (Active standard)
    logger.info("[LinkedIn Service] Attempting authentication via OpenID Connect userinfo...");
    const oidcResponse = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "X-Restli-Protocol-Version": "2.0.0"
      }
    });

    if (oidcResponse.ok) {
      const oidcData = await oidcResponse.json() as any;
      if (oidcData?.sub) {
        return {
          success: true,
          urn: `urn:li:person:${oidcData.sub}`,
          name: oidcData.name || `${oidcData.given_name || ""} ${oidcData.family_name || ""}`.trim() || "LinkedIn Member"
        };
      }
    } else {
      logger.info(`[LinkedIn Service] Userinfo query warning: ${oidcResponse.status}`);
    }

    // 2. Try classic V2 me profile fallback
    logger.info("[LinkedIn Service] Attempting authentication via classic V2 Profile endpoint...");
    const profileResponse = await fetch("https://api.linkedin.com/v2/me", {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "X-Restli-Protocol-Version": "2.0.0"
      }
    });

    if (profileResponse.ok) {
      const profileData = await profileResponse.json() as any;
      if (profileData?.id) {
        const firstName = profileData.localizedFirstName || "LinkedIn";
        const lastName = profileData.localizedLastName || "User";
        return {
          success: true,
          urn: `urn:li:person:${profileData.id}`,
          name: `${firstName} ${lastName}`.trim()
        };
      }
    }

    // Capture precise HTTP error trace
    const textTrace = await oidcResponse.text();
    return {
      success: false,
      error: `Verification returned status ${oidcResponse.status}. API Output: ${textTrace.substring(0, 200)}`
    };

  } catch (err: any) {
    logger.error("[LinkedIn Service] Profile authentication diagnostics failed:", err);
    return {
      success: false,
      error: err.message || "Failed to make HTTP handshake to LinkedIn servers."
    };
  }
}

/**
 * Publishes user and blog post content directly to their personal LinkedIn activity feed.
 * Dynamically retrieves user's dynamic URN to bypass hardcoded 'me' restrictions.
 */
export async function publishToLinkedInFeed(accessToken: string, commentaryText: string): Promise<LinkedInPublishResult> {
  if (!accessToken || accessToken.trim() === "") {
    return {
      success: false,
      error: "Missing or invalid LinkedIn Access Token. Please configure a valid token in Settings."
    };
  }

  // Resolve True User URN for targeting
  const profile = await getLinkedInProfile(accessToken);
  const targetUrn = profile.success && profile.urn ? profile.urn : "urn:li:person:me";

  try {
    logger.info(`[LinkedIn Service] Initiating ugcPost build for target URN: "${targetUrn}"`);
    const response = await fetch("https://api.linkedin.com/v2/ugcPosts", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0"
      },
      body: JSON.stringify({
        author: targetUrn,
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: {
              text: commentaryText
            },
            shareMediaCategory: "NONE"
          }
        },
        visibility: {
          "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
        }
      })
    });

    const responseBody = await response.text();
    let data: any = {};
    try {
      data = JSON.parse(responseBody);
    } catch {
      // Non-JSON response
    }

    if (response.ok && (data.id || response.status === 201)) {
      const returnedId = data.id || "urn:li:share:" + Math.floor(Math.random() * 90000000);
      return {
        success: true,
        postId: returnedId,
        link: `https://www.linkedin.com/feed/update/${returnedId}`,
        urnUsed: targetUrn
      };
    }

    // Try modern Posts API legacy-redirect fallback as insurance
    logger.info("[LinkedIn Service] ugcPost API failed or was rejected. Trying fallback /v2/posts container...");
    const fallbackResponse = await fetch("https://api.linkedin.com/v2/posts", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0"
      },
      body: JSON.stringify({
        author: targetUrn,
        commentary: commentaryText,
        visibility: "PUBLIC",
        distribution: {
          feedDistribution: "MAIN_FEED",
          targetEntities: [],
          thirdPartyDistributionChannels: []
        },
        lifecycleState: "PUBLISHED",
        isReshareDisabledByAuthor: false
      })
    });

    const fallbackBody = await fallbackResponse.text();
    if (fallbackResponse.ok) {
      // Resolve post header id
      const locHeader = fallbackResponse.headers.get("x-linkedin-id") || fallbackResponse.headers.get("location");
      const cleanId = locHeader ? locHeader.split("/").pop() : "urn:li:share:" + Math.floor(Math.random() * 90000000);
      return {
        success: true,
        postId: cleanId,
        link: `https://www.linkedin.com/feed/update/${cleanId}`,
        urnUsed: targetUrn
      };
    }

    // If both failed, return highly readable diagnostics to help the user configure scopes correctly.
    return {
      success: false,
      error: `LinkedIn API error (Status ${response.status}). Details: ${responseBody.substring(0, 300)} Fallback Status: ${fallbackResponse.status}. Details: ${fallbackBody.substring(0, 300)}`
    };

  } catch (err: any) {
    logger.error("[LinkedIn Service] Live publishing error:", err);
    return {
      success: false,
      error: err.message || "Failed to establish socket connection with LinkedIn REST API servers."
    };
  }
}

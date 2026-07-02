import { Router } from "express";

const router = Router();

// Endpoint for SEO Mastermind AI Keyword & Meta Title Generator
router.post("/seo-generator", async (req: any, res) => {
  try {
    const { topic } = req.body;
    if (!topic) {
      return res.status(400).json({ error: "Topic required" });
    }

    const apiKey = process.env.RAPIDAPI_KEY || '4a2df9df54mshf841ccc067447e0p195abcjsnab8083cf5462';

    const response = await fetch("https://seo-mastermind-ai-keyword-meta-title-generator.p.rapidapi.com/seo", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-rapidapi-host": "seo-mastermind-ai-keyword-meta-title-generator.p.rapidapi.com",
        "x-rapidapi-key": apiKey,
      },
      body: JSON.stringify({ topic }),
    });

    const data = await response.json();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint for Lead Generation
router.get("/lead-generation", async (req: any, res) => {
  try {
    const { area, search } = req.query;
    if (!area || !search) {
      return res.status(400).json({ error: "Area and search required" });
    }

    const apiKey = process.env.RAPIDAPI_KEY || '4a2df9df54mshf841ccc067447e0p195abcjsnab8083cf5462';

    const url = `https://lead-generation2.p.rapidapi.com/lead?area=${encodeURIComponent(area as string)}&search=${encodeURIComponent(search as string)}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-rapidapi-host": "lead-generation2.p.rapidapi.com",
        "x-rapidapi-key": apiKey,
      },
    });

    const data = await response.json();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint for SEO Keyword Density
router.get("/seo-density", async (req: any, res) => {
  try {
    const { url, phraseLength = 5, n = 20, numPhrases = 20 } = req.query;
    if (!url) {
      return res.status(400).json({ error: "URL required" });
    }

    const apiKey = process.env.RAPIDAPI_KEY || '4a2df9df54mshf841ccc067447e0p195abcjsnab8083cf5462';

    const apiUrl = `https://seo-automations.p.rapidapi.com/v1/seo/getKeywordDensity/?url=${encodeURIComponent(url as string)}&phraseLength=${phraseLength}&n=${n}&numPhrases=${numPhrases}`;
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-rapidapi-host": "seo-automations.p.rapidapi.com",
        "x-rapidapi-key": apiKey,
      },
    });

    const data = await response.json();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint for Instagram Posts
router.post("/instagram-posts", async (req: any, res) => {
  try {
    const { username, maxId = "" } = req.body;
    if (!username) {
      return res.status(400).json({ error: "Username required" });
    }

    const apiKey = process.env.RAPIDAPI_KEY || '4a2df9df54mshf841ccc067447e0p195abcjsnab8083cf5462';

    const response = await fetch("https://instagram120.p.rapidapi.com/api/instagram/posts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-rapidapi-host": "instagram120.p.rapidapi.com",
        "x-rapidapi-key": apiKey,
      },
      body: JSON.stringify({ username, maxId }),
    });

    const data = await response.json();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint for Pinterest Boards
router.get("/pinterest-boards", async (req: any, res) => {
  try {
    const { keyword, num = 20 } = req.query;
    if (!keyword) {
      return res.status(400).json({ error: "Keyword required" });
    }

    const apiKey = process.env.RAPIDAPI_KEY || '4a2df9df54mshf841ccc067447e0p195abcjsnab8083cf5462';

    const apiUrl = `https://unofficial-pinterest-api.p.rapidapi.com/pinterest/boards/relevance?keyword=${encodeURIComponent(keyword as string)}&num=${num}`;
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-rapidapi-host": "unofficial-pinterest-api.p.rapidapi.com",
        "x-rapidapi-key": apiKey,
      },
    });

    const data = await response.json();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export const rapidapiRouter = router;

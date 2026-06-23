import { logger } from "../../lib/logger";

interface PinterestConfig {
  accessToken: string;
  boardId: string;
}

export class PinterestClient {
  private config: PinterestConfig;
  
  constructor(config: PinterestConfig) {
    this.config = config;
  }

  async createPin(data: {
    title: string;
    description: string;
    link: string;
    mediaUrl: string;
  }) {
    logger.info(`[Pinterest] Creating pin: ${data.title}`);
    
    if (!this.config.accessToken) {
       logger.error('[Pinterest] Cannot publish, access token missing');
       throw new Error('Pinterest API Token required');
    }

    try {
      const payload = {
        board_id: this.config.boardId,
        title: data.title,
        description: data.description,
        link: data.link,
        media_source: {
            source_type: "image_url",
            url: data.mediaUrl
        }
      };

      const response = await fetch("https://api.pinterest.com/v5/pins", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.config.accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
         const errText = await response.text();
         throw new Error(`Pinterest API error: ${response.status} - ${errText}`);
      }

      const result = await response.json();
      logger.info(`[Pinterest] Successfully created Pin ID: ${result.id}`);
      return result;

    } catch (err: any) {
      logger.error(`[Pinterest] Pin creation failed: ${err.message}`);
      throw err;
    }
  }
}

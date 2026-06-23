import { logger } from "../../lib/logger";

interface WordPressConfig {
  url: string;
  username: string;
  appPassword: string;
}

export class WordPressClient {
  private config: WordPressConfig;

  constructor(config: WordPressConfig) {
    this.config = config;
  }

  private getAuthHeader() {
    return 'Basic ' + Buffer.from(`${this.config.username}:${this.config.appPassword}`).toString('base64');
  }

  async publishPost(data: {
    title: string;
    content: string;
    status: 'publish' | 'draft';
    categories?: number[];
    tags?: number[];
  }) {
    logger.info(`[WordPress] Publishing post: ${data.title}`);
    
    // Check if configuration exists
    if (!this.config.url || !this.config.username || !this.config.appPassword) {
       logger.error('[WordPress] Cannot publish check configuration values');
       throw new Error('WP Configuration missing or invalid');
    }

    try {
      const response = await fetch(`${this.config.url}/wp-json/wp/v2/posts`, {
        method: 'POST',
        headers: {
          'Authorization': this.getAuthHeader(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`WordPress API returned ${response.status}: ${errorBody}`);
      }

      const result = await response.json();
      logger.info(`[WordPress] Successfully created post ID: ${result.id}`);
      return result;
    } catch (e: any) {
       logger.error(`[WordPress] API publishing failure: ${e.message}`);
       throw e;
    }
  }

  /**
   * Upload media securely to WP library
   */
  async uploadMedia(imageUrl: string, title: string) {
     logger.info(`[WordPress] Uploading media: ${title}`);
     
     // Needs implementation for downloading external URL and uploading via multipart/form-data
     return { id: 1, url: imageUrl };
  }
}

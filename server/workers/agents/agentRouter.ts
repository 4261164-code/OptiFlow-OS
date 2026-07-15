// server/workers/agents/agentRouter.ts
import OpenAI from "openai";

export async function runAgentRouter(input: any) {
  const { keyword } = input;

  const apiKey = process.env.OPENAI_API_KEY;

  if (apiKey) {
      const openai = new OpenAI({ apiKey });
      // 1. SEO Agent (content strategy)
      const contentPlan = await openai.chat.completions.create({
        model: "gpt-4.1-mini",
        messages: [
          {
            role: "system",
            content: "You are an SEO strategist. Output structured JSON."
          },
          {
            role: "user",
            content: `Generate SEO content plan for: ${keyword}`
          }
        ]
      });
    
      const plan = JSON.parse(contentPlan.choices[0].message.content || "{}");
    
      return {
        keyword,
        title: plan.title,
        article: plan.article,
        meta: plan.meta,
        tags: plan.tags
      };
  } else {
      // Mock if no API key is provided
      console.warn("No OPENAI_API_KEY provided. Using mock agent router.");
      return {
          keyword,
          title: `Optimized plan for ${keyword}`,
          article: `This is an auto-generated high quality article about ${keyword}.`,
          meta: `SEO meta description for ${keyword}`,
          tags: ["seo", keyword]
      };
  }
}

import { runAgentRouter } from "../agents/agentRouter";
import { publishToWordPress } from "../../integrations/wordpress";
import { publishToPinterest } from "../../integrations/pinterest";

export async function processJob(job: any) {
  switch (job.type) {

    case "generate_content":
      return await runAgentRouter(job.payload);

    case "publish_wordpress":
      return await publishToWordPress(job.payload);

    case "distribute_pinterest":
      return await publishToPinterest(job.payload);

    // Provide handlers for existing types in our JobObject schema (content, seo, publish, distribute) 
    // to keep backward compatibility or general matching
    case "content":
      return await runAgentRouter(job.payload);
      
    case "seo":
      return await runAgentRouter(job.payload);

    case "publish":
      return await publishToWordPress(job.payload);

    case "distribute":
      return await publishToPinterest(job.payload);

    default:
      throw new Error("Unknown job type: " + job.type);
  }
}

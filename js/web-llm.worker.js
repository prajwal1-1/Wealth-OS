/**
 * WEALTH OS WEBELLM DEDICATED WEB WORKER
 * Offloads all WebGPU computation & token generation from the main UI thread.
 */

import { WebWorkerMLCEngineHandler } from "https://esm.run/@mlc-ai/web-llm";

const handler = new WebWorkerMLCEngineHandler();

self.onmessage = (msg) => {
  handler.onmessage(msg);
};
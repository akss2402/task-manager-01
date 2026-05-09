import "dotenv/config";
import { getConfig } from "./config.js";
import { createApp } from "./app.js";

async function start() {
  try {
    const cfg = getConfig();
    const app = createApp();

    const host = "0.0.0.0";
    app.listen(cfg.PORT, host, () => {
      console.log(`API listening on ${host}:${cfg.PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

start();


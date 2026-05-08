import "dotenv/config";
import { getConfig } from "./config.js";
import { createApp } from "./app.js";

const cfg = getConfig();
const app = createApp();

app.listen(cfg.PORT, () => {
  console.log(`API listening on http://localhost:${cfg.PORT}`);
});


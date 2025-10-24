import express from "express";
import dotenv from "dotenv";
import { PRReviewFlow } from "./ai/genkit";
import { fetchPRDiffs } from "./utils/diff";

dotenv.config();

const port = process.env.PORT ? Number(process.env.PORT) : 3000;

const server = express();
server.use(express.json());

server.get("/health", (_req, res) => {
  res.json({ ok: true });
});

server.get("/pr-review", async (req, res) => {
  console.log("url", req.body.url);

  const diffs = await fetchPRDiffs(req.body.url);
  console.log(diffs);

  const output = await PRReviewFlow({ diff: diffs });
  console.log("output", output);

  res.json(output);
});

server.listen(port, () => {
  console.log(`PR Review Bot listening on :${port}`);
});

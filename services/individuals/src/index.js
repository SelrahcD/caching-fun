import express from "express";
import cors from "cors";
import crypto from "node:crypto";
import { individuals } from "./seed-data.js";

const app = express();
app.use(cors());
app.use(express.json());

function computeEtag(data) {
  return crypto.createHash("md5").update(JSON.stringify(data)).digest("hex");
}

// GET /individuals/:id
app.get("/individuals/:id", (req, res) => {
  const individual = individuals.get(req.params.id);
  if (!individual) {
    return res.status(404).json({ error: "Individual not found" });
  }

  const etag = computeEtag(individual);

  // Conditional request: return 304 if ETag matches
  if (req.headers["if-none-match"] === etag) {
    return res.status(304).end();
  }

  res.set("Cache-Control", "max-age=60");
  res.set("ETag", etag);
  res.set("X-Xkey", `individual-${individual.id}`);
  res.json(individual);
});

// PUT /individuals/:id
app.put("/individuals/:id", (req, res) => {
  const individual = individuals.get(req.params.id);
  if (!individual) {
    return res.status(404).json({ error: "Individual not found" });
  }

  const { firstName, lastName, avatarId } = req.body;
  if (firstName !== undefined) individual.firstName = firstName;
  if (lastName !== undefined) individual.lastName = lastName;
  if (avatarId !== undefined) individual.avatarId = avatarId;

  individuals.set(req.params.id, individual);

  res.set("X-Purge", `individual-${individual.id}`);
  res.json(individual);
});

const PORT = 4002;
app.listen(PORT, () => {
  console.log(`Individuals service running on port ${PORT}`);
});

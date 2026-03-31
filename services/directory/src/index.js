import express from "express";
import cors from "cors";
import crypto from "node:crypto";
import { teams } from "./seed-data.js";

const app = express();
app.use(cors());
app.use(express.json());

function computeEtag(data) {
  return crypto.createHash("md5").update(JSON.stringify(data)).digest("hex");
}

// GET /teams — list all teams (id + name only)
app.get("/teams", (req, res) => {
  const teamList = Array.from(teams.values()).map(({ id, name }) => ({ id, name }));
  const etag = computeEtag(teamList);

  if (req.headers["if-none-match"] === etag) {
    return res.status(304).end();
  }

  res.set("Cache-Control", "max-age=60");
  res.set("ETag", etag);
  res.set("X-Xkey", "teams-list");
  res.json(teamList);
});

// GET /teams/:id — single team with memberIds
app.get("/teams/:id", (req, res) => {
  const team = teams.get(req.params.id);
  if (!team) {
    return res.status(404).json({ error: "Team not found" });
  }

  const etag = computeEtag(team);

  if (req.headers["if-none-match"] === etag) {
    return res.status(304).end();
  }

  res.set("Cache-Control", "max-age=60");
  res.set("ETag", etag);
  res.set("X-Xkey", `team-${team.id}`);
  res.json(team);
});

// PUT /teams/:id/members — update member list
app.put("/teams/:id/members", (req, res) => {
  const team = teams.get(req.params.id);
  if (!team) {
    return res.status(404).json({ error: "Team not found" });
  }

  const { memberIds } = req.body;
  if (!Array.isArray(memberIds)) {
    return res.status(400).json({ error: "memberIds must be an array" });
  }

  team.memberIds = memberIds;
  teams.set(req.params.id, team);

  // Purge this team's cache AND the teams list cache
  res.set("X-Purge", `team-${team.id} teams-list`);
  res.json(team);
});

const PORT = 4001;
app.listen(PORT, () => {
  console.log(`Directory service running on port ${PORT}`);
});

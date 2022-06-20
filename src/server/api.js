"use strict";

const express = require("express");
const git = require("simple-git");
const fs = require("fs");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");

import { mergeProcess } from "./merge";
import { getMergeCommits } from "./getMergeCommits";
import { cherryPickProcess } from "./cherryPick";
import { getProfiles, addProfile, deleteProfile, updateProfile} from "./profiles";
import PQueue from "p-queue";
const queue = new PQueue({ concurrency: 1 });

const PORT = 4000;
const app = express();
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(cors());

app.get("/handshake", async function (req, res) {
  const { location } = req.query;
  const configPath = path.join(__dirname, "config.json");
  fs.readFile(configPath, function (err, data) {
    if (err) {
      console.log(`ERROR: Config file missing`);
      res.writeHead(400, {
        "Content-Type": "application/json",
        "access-control-allow-origin": "*",
      });
      res.end(JSON.stringify({ ERROR: "Config file missing" }));
      return;
    }
    const config = JSON.parse(data);
    if (
      !config.repos ||
      config.repos.length === 0 ||
      !config.repos.some((repo) => location.startsWith(repo.url))
    ) {
      res.writeHead(400, {
        "Content-Type": "application/json",
        "access-control-allow-origin": "*",
      });
      console.log(`ERROR: URL Not Found`);
      res.end(JSON.stringify({ ERROR: "URL Not Found" }));
      return;
    }
    res
      .writeHead(200, {
        "access-control-allow-origin": "*",
      })
      .end();
    return;
  });
});

app.get("/profiles", async function (req, res) {
  await getProfiles(res);
});
app.post("/profiles", async function (req, res) {
  await addProfile(req.body, res);
});
app.delete("/profiles", async function (req, res) {
  await deleteProfile(req.body.id, res);
});
app.put('/profiles', async function (req,res){
  await updateProfile(req.body.id, req.body.profileData, res);
});

app.get("/merge", async function (req, res) {
  res.writeHead(200, {
    "Content-Type": "text/plain",
    "Transfer-Encoding": "chunked",
    "access-control-allow-origin": "*",
  });
  res.write(`Merge Queued `);
  const configPath = path.join(__dirname, "config.json");
  fs.readFile(configPath, function (err, data) {
    if (err) {
      console.log(`ERROR: Config file missing`);
      res.end("ERROR Config file missing");
      return;
    }
    const jsonData = JSON.parse(data);
    queue.add(async () => await mergeProcess(req, res, jsonData));
  });
});

app.post("/cherrypick", async function (req, res) {
  res.writeHead(200, {
    "Content-Type": "text/plain",
    "Transfer-Encoding": "chunked",
    "access-control-allow-origin": "*",
  });
  res.write(`Cherry-Pick Queued `);
  queue.add(async () => await cherryPickProcess(req, res));
});

app.post("/mergecommits", async function (req, res) {
  res.writeHead(200, {
    "Content-Type": "application/json",
    "access-control-allow-origin": "*",
  });
  const configPath = path.join(__dirname, "config.json");
  fs.readFile(configPath, function (err, data) {
    if (err) {
      console.log(`ERROR: Config file missing`);
      res.end(JSON.stringify({ ERROR: "Config file missing" }));
      return;
    }
    const jsonData = JSON.parse(data);
    getMergeCommits(req, res, jsonData);
  });
});

app.listen(PORT, () => {
  console.log("Gitlab CLI listening at 4000...");
});
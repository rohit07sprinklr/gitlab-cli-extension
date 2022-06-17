"use strict";

const express = require("express");
const git = require("simple-git");
const fs = require("fs");
const bodyParser = require("body-parser");
const cors = require("cors");
let config;

try {
  config = JSON.parse(fs.readFileSync("./config.json", "utf-8"));
} catch (e) {
  console.error("missing config.json");
  process.exit(1);
}
import { mergeProcess } from "./merge";
import { getMergeCommits } from "./getMergeCommits";
import { cherryPickProcess } from "./cherryPick";
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

let count = 0;
queue.on("active", () => {
  console.log(`Working on Request #${++count}`);
});

function wait(millis) {
  return new Promise((res) => setTimeout(res, millis));
}

app.get("/handshake", async function (req, res) {
  const { location } = req.query;
  if (config.repos.some((repo) => location.startsWith(repo.url))) {
    res
      .writeHead(200, {
        "access-control-allow-origin": "*",
      })
      .end();
    return;
  }
  res
    .writeHead(500, {
      "access-control-allow-origin": "*",
    })
    .end();
});

app.get("/merge", async function (req, res) {
  res.writeHead(200, {
    "Content-Type": "text/plain",
    "Transfer-Encoding": "chunked",
    "access-control-allow-origin": "*",
  });
  res.write(`Merge Queued `);
  console.log(req.query);
  queue.add(async () => await mergeProcess(req, res, config));
});

app.post("/cherrypick", async function (req, res) {
  res.writeHead(200, {
    "Content-Type": "text/plain",
    "Transfer-Encoding": "chunked",
    "access-control-allow-origin": "*",
  });
  queue.add(async () => await cherryPickProcess(req, res));
});

app.post("/mergecommits", async function (req, res) {
  res.writeHead(200, {
    "Content-Type": "application/json",
    "access-control-allow-origin": "*",
  });
  getMergeCommits(req, res, config);
});

app.listen(PORT, () => {
  console.log("Gitlab CLI listening at 4000...");
});
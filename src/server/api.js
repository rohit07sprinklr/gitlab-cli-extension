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

async function mergeProcess(req, res) {
  try {
    const { source, target, location } = req.query;
    const path = config.repos.find((repo) =>
      location.startsWith(repo.url)
    ).path;
    await wait(100);
    console.log("start merge");
    console.log(`fetching ${source}`);
    res.write(`fetching ${source}`);

    console.log(`fetching ${target}`);
    res.write(`fetching ${target}`);
    await git(path).fetch("origin", target);

    await git(path).checkout(source);
    await git(path).raw("reset", "--hard", `origin/${source}`);

    await git(path).checkout(target);
    await git(path).raw("reset", "--hard", `origin/${target}`);

    console.log(`Checking conflicts`);
    res.write(`Checking conflicts`);

    const result = await git(path).raw("merge", "--no-ff", source);
    const mergeStatus = result.split("\n")[1];
    if (mergeStatus.startsWith("CONFLICT")) {
      const conflictMessage = result.split("\n")[2];
      await wait(1000);
      console.log("Conflict Encountered: Aborting");
      await git(path).raw("merge", "--abort");
      throw new Error(conflictMessage);
    }
    console.log("No Conflict detected!");
    res.write(`No Conflict detected: Commiting Changes`);
    await wait(100);
    console.log(`merged, pushing ${target}`);
    res.write(`merged, pushing ${target}`);
    await git(path).push("origin", target);

    console.log(`pushed ${target}`);
    res.write(`pushed ${target}`);
    await wait(1000);
    res.write(`Merged`);
    console.log("end merge successfully");
    res.end();
  } catch (e) {
    res.write(`${e.toString()}`);
    console.error(e);
    console.log("End merge failure");
    res.end();
  }
}
async function cherryPickCommit(gitLogs, path, res) {
  for (const gitLog of gitLogs) {
    const commitInfo = gitLog.split(" ");
    console.log(`Working on ${commitInfo[0]}`);
    res.write(`Working on ${commitInfo[0]}: `);
    try {
      const cherryPickResult = await git(path).raw([
        "cherry-pick",
        "-m",
        "1",
        `${commitInfo[0]}`,
      ]);
      console.log(cherryPickResult);
      await wait(500);
      console.log("Success");
      res.write(`Success !`);
    } catch (e) {
      await wait(500);
      console.log("Success");
      res.write(`Failed !`);
      console.log(e);
    }
    await wait(500);
  }
}
async function cherryPickProcess(req, res) {
  try {
    const { commitAuthor, commitBranch, commitTime, location } = req.body;
    const path = config.repos.find((repo) =>
      location.startsWith(repo.url)
    ).path;
    const commitTimeFormatted = commitTime.replace("T", " ");
    await wait(100);
    await git(path).checkout(commitBranch);
    await git(path).raw("reset", "--hard", `origin/${commitBranch}`);
    const resp = await git(path).raw([
      "log",
      "--pretty=format:%h - %an, %ad : %s",
      "--author",
      `${commitAuthor}`,
      "--remotes",
      "--merges",
      "--since",
      `${commitTimeFormatted}`,
    ]);
    const result = resp.split("\n");
    console.log(result);
    await cherryPickCommit(result.reverse(), path, res);
    // await git(path).push("origin", commitBranch);
    res.end();
  } catch (e) {
    res.end();
  }
}
async function getMergeCommits(req, res) {
  try {
    const { commitAuthor, commitBranch, commitTime, location } = req.body;
    const path = config.repos.find((repo) =>
      location.startsWith(repo.url)
    ).path;
    const commitTimeFormatted = commitTime.replace("T", " ");
    const resp = await git(path).raw([
      "log",
      "--pretty=format:%h--%ad--%s",
      "--author",
      `${commitAuthor}`,
      "--remotes",
      "--merges",
      "--since",
      `${commitTimeFormatted}`,
    ]);
    const result = resp.split("\n");
    const gitLogs = result.reverse();
    const jsonResponse = {};
    jsonResponse.commits = [];
    for (const gitLog of gitLogs) {
      const commitInfo = gitLog.split("--");
      const commitJSONdata = {
        commitSHA: commitInfo[0],
        commitDate: commitInfo[1],
        commitMessage: commitInfo[2],
      };
      jsonResponse.commits.push(commitJSONdata);
    }
    res.end(JSON.stringify(jsonResponse));
  } catch (e) {
    res.end();
  }
}

app.get("/handshake", async function (req, res, next) {
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

app.get("/merge", async function (req, res, next) {
  res.writeHead(200, {
    "Content-Type": "text/plain",
    "Transfer-Encoding": "chunked",
    "access-control-allow-origin": "*",
  });
  res.write(`Merge Queued `);
  queue.add(async () => await mergeProcess(req, res));
});

app.post("/cherrypick", async function (req, res, next) {
  res.writeHead(200, {
    "Content-Type": "text/plain",
    "Transfer-Encoding": "chunked",
    "access-control-allow-origin": "*",
  });
  queue.add(async () => await cherryPickProcess(req, res));
});

app.post("/mergecommits", async function (req, res, next) {
  res.writeHead(200, {
    "Content-Type": "application/json",
    "access-control-allow-origin": "*",
  });
  getMergeCommits(req, res);
});

app.listen(PORT, () => {
  console.log("Gitlab CLI listening at 4000...");
});
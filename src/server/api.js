"use strict";

const express = require("express");
const git = require("simple-git");
const fs = require("fs");
let config;

try {
  config = JSON.parse(fs.readFileSync("./config.json", "utf-8"));
} catch (e) {
  console.error("missing config.json");
  process.exit(1);
}
import PQueue from 'p-queue';
const queue = new PQueue({concurrency: 1});

const PORT = 4000;
const app = express();

let count = 0;
queue.on('active', () => {
	console.log(`Working on Request #${++count}`);
});

function wait(millis) {
  return new Promise((res) => setTimeout(res, millis));
}

async function mergeProcess(req,res){
  try {
    const { source, target, location } = req.query;
    const path = config.repos.find((repo) =>
      location.startsWith(repo.url)
    ).path;
    console.log("start merge");
    console.log(`fetching ${source}`);
    res.write(`fetching ${source}`);
    await git(path).fetch("origin", source);

    console.log(`fetching ${target}`);
    res.write(`fetching ${target}`);
    await git(path).fetch("origin", target);

    await git(path).checkout(source);
    await git(path).raw("reset", "--hard", `origin/${source}`);

    await git(path).checkout(target);
    await git(path).raw("reset", "--hard", `origin/${target}`);

    const result = await git(path).raw("merge","--no-commit","--no-ff", source);
    const conflictStatus = (result.split('\n'))[1];
    if(conflictStatus == undefined){
      console.log('No Conflict detected!');

      res.write(`No Conflict detected: Commiting Changes`);
      await git(path).raw("commit", "-m","Merged");

      console.log(`merged, pushing ${target}`);
      res.write(`merged, pushing ${target}`);
      await git(path).push("origin", target);

      console.log(`pushed ${target}`);
      res.write(`pushed ${target}`);
      await wait(2000);
      console.log("end merge successfully");
    }
    else if(conflictStatus.startsWith("CONFLICT")){
      await wait(10000);
      console.log('Conflict Encountered: Aborting');
      await git(path).raw("merge", "--abort");
      res.write(`Conflict Encountered: Merge Aborted!`);
    }
    res.end();
  } catch (e) {
    res.write(`error: ${e.toString()}`);
    await wait(100);
    res.write(`ERROR`);
    console.error(e);
    console.log("end merge failure");
    res.end();
  }
}

app.get("/handshake", async function (req, res) {
  const { location } = req.query;
  if (config.repos.some((repo) => location.startsWith(repo.url))) {
    res.writeHead(200, {
        "access-control-allow-origin": "*",
      }).end();
    return;
  }
  res.writeHead(500, {
      "access-control-allow-origin": "*",
    }).end();
});

app.get("/merge", async function (req, res) {
  res.writeHead(200, {
    "Content-Type": "text/plain",
    "Transfer-Encoding": "chunked",
    "access-control-allow-origin": "*",
  });
  res.write(`Merge Queued`);
  queue.add(async () => await mergeProcess(req,res));
});

app.listen(PORT, () => {
  console.log("Gitlab CLI listening at 4000...");
});
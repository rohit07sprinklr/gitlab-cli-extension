const git = require("simple-git");

import {wait} from './utils';

async function cherryPickCommit(gitLogs, path, res) {
  for (const gitLog of gitLogs) {
    if (gitLog.commitScope == false) {
      res.write(`Skipped Commit-${gitLog.commitID} (${gitLog.commitSHA})`);
      await wait(1000);
      continue;
    }
    res.write(`Working on Commit-${gitLog.commitID} (${gitLog.commitSHA})`);
    try {
      const cherryPickResult = await git(path).raw([
        "cherry-pick",
        "-m",
        "1",
        `${gitLog.commitSHA}`,
      ]);
      console.log(cherryPickResult);
      await wait(500);
      console.log("Success");
      res.write(`Success\n`);
    } catch (e) {
      await wait(500);
      console.log("Failed");
      res.write(`${e.toString()}\n`);
      console.log(e);
    }
    await wait(500);
  }
}
async function cherryPickProcess(req, res) {
  try {
    const path = req.body.localPath;
    const commitBranch = req.body.commitBranch;
    const targetBranch = req.body.targetBranch;
    await wait(100);
    try {
      await git(path).listRemote([
        "--heads",
        "--exit-code",
        "origin",
        `${commitBranch}`,
      ]);
      //If found on remote repo
      await git(path).fetch("origin", commitBranch);
      await git(path).checkout(commitBranch);
      await git(path).raw("reset", "--hard", `origin/${commitBranch}`);
    } catch {
      const anss = await git(path).branchLocal();
      if (anss.all.includes(`${commitBranch}`)) {
        //Not found on remote repo Found in local repo
        await git(path).checkout(commitBranch);
      }
      //Niether in local nor remote repo checkout new branch from target branch
      else {
        await git(path).checkoutBranch(`${commitBranch}`, `${targetBranch}`);
      }
    }

    await cherryPickCommit(req.body.commits, path, res);
    //git push --set-upstream origin feature/cherry-pick
    res.end();
  } catch (e) {
    res.write(`${e.toString()}`);
    console.error(e);
    res.end();
  }
}

export { cherryPickProcess };

const git = require("simple-git");

import {wait} from './utils';

async function cherryPickProcess(req, res) {
  try {
    const {localPath,commitBranch,targetBranch,requestType } = req.body;
    await wait(100);
    if(requestType === 'new'){
      try {
        await git(localPath).listRemote([
          "--heads",
          "--exit-code",
          "origin",
          commitBranch,
        ]);
        //If found on remote repo
        await git(localPath).fetch("origin", commitBranch);
        await git(localPath).checkout(commitBranch);
        await git(localPath).raw("reset", "--hard", `origin/${commitBranch}`);
      }catch{
        //Niether in local nor remote repo checkout new branch from target branch
        await git(localPath).checkoutBranch(commitBranch, targetBranch);
      }
    }else if(requestType === "continue"){
      await git(localPath).checkout(commitBranch);
    }
    const gitLogs = req.body.commits;
    let completedCommits = 0;
    let currentCommitSHA;
    try {
      for (const gitLog of gitLogs) {
        completedCommits += 1;
        currentCommitSHA = gitLog.commitSHA;
        if (gitLog.commitScope == false) {
          continue;
        }
        res.write(`Cherry pick ${gitLog.commitSHA}`);
        const cherryPickResult = await git(localPath).raw([
          "cherry-pick",
          "-m",
          "1",
          gitLog.commitSHA,
        ]);
        await wait(500);
        console.log(`Cherry-pick ${gitLog.commitSHA} Successful`);
        console.log(cherryPickResult);
        res.write(`Cherry-pick ${gitLog.commitSHA} Successful`);
        await wait(500);
      }
    } catch (e) {
      await git(localPath).raw("reset", "--hard");
      console.log("Failed");
      res.write(`<strong> Automatic Cherry-pick ${currentCommitSHA} Failed: You can still cherry-pick this commit manually. 
      Press Continue after manually cherry pick or Stop to End</strong> <br> Copy and paste this in your local repository:<br>  
      <div class="card">
        <div class="card-body">
          <b>git cherry-pick -m 1 ${currentCommitSHA}</b>
        </div>
      </div>${e.toString()}`);
      await wait(100);
      res.write(`Paused {${completedCommits}}`);
      res.end();
      console.log(e);
      return;
    }
    //git push --set-upstream origin feature/cherry-pick
    res.write("Cherry Pick Completed");
    res.end();
  } catch (e) {
    res.write(e.toString());
    console.error(e);
    res.end();
  }
}

export { cherryPickProcess };

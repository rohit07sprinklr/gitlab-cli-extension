const git = require("simple-git");

function wait(millis) {
  return new Promise((res) => setTimeout(res, millis));
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
    const gitLogs = req.body.commits;
    let currentCommitIndex = 0;
    try {
      for (const gitLog of gitLogs) {
        currentCommitIndex += 1;
        if (gitLog.commitScope == false) {
          continue;
        }
        res.write(`Cherry pick ${gitLog.commitSHA}`);
        const cherryPickResult = await git(path).raw([
          "cherry-pick",
          "-m",
          "1",
          `${gitLog.commitSHA}`,
        ]);
        await wait(500);
        console.log(`Cherry-pick ${gitLog.commitSHA} Successful`);
        console.log(cherryPickResult);
        res.write(`Cherry-pick ${gitLog.commitSHA} Successful`);
        await wait(500);
      }
    } catch (e) {
      await git(path).raw("reset", "--hard");
      console.log("Failed");
      res.write(`Cherry-pick paused - ${e.toString()}`);
      await wait(100);
      res.write(`Paused {${currentCommitIndex}}`);
      res.end();
      console.log(e);
      return;
    }
    //git push --set-upstream origin feature/cherry-pick
    res.write("Cherry Pick Completed");
    res.end();
  } catch (e) {
    res.write(`${e.toString()}`);
    console.error(e);
    res.end();
  }
}

export { cherryPickProcess };

const git = require("simple-git");

async function getMergeCommits(req, res, config) {
  try {
    if(!config.repos || config.repos.length===0){
      console.log(`ERROR: URL Not Found`);
      res.end(JSON.stringify({"ERROR":"URL Not Found"}));
      return;
    }
    const { commitAuthor, commitBranch, commitTime, location } = req.body;
    const matchedRepo = config.repos.find((repo) =>
      location.startsWith(repo.url)
    )
    if(!matchedRepo){
      console.log(`ERROR: URL Not Found`);
      res.end(JSON.stringify({"ERROR":"URL Not Found"}));
      return;
    }
    const path = matchedRepo.path;
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
    const jsonResponse = {};
    jsonResponse["commits"] = [];
    if (!resp.trim()) {
      res.end(JSON.stringify(jsonResponse));
      console.log("No Commits Found!");
      return;
    }
    const result = resp.split("\n");
    const gitLogs = result.reverse();
    jsonResponse["path"] = path;
    for (const gitLog of gitLogs) {
      const commitInfo = gitLog.split("--");
      const commitJSONdata = {
        commitSHA: commitInfo[0],
        commitDate: commitInfo[1],
        commitMessage: commitInfo[2],
      };
      jsonResponse["commits"].push(commitJSONdata);
    }
    res.end(JSON.stringify(jsonResponse));
  } catch (e) {
    console.log(e);
    res.end();
  }
}

export { getMergeCommits };
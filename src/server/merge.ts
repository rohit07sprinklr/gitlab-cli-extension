const git = require("simple-git");

import {wait} from './utils';

async function mergeProcess(req, res, config) {
  try {
    const { source, target, location } = req.query;
    const path = config.repos.find((repo) =>
      location.startsWith(repo.url)
    ).path;
    await wait(100);
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

    console.log(`Checking conflicts`);
    res.write(`Checking conflicts`);

    const result = await git(path).raw("merge", "--no-ff", source);
    const mergeStatus = result.split("\n")[1];
    if (mergeStatus.startsWith("CONFLICT")) {
      const conflictMessage = result.split("\n")[2];
      await wait(1000);
      console.log("Conflict Encountered: Aborting");
      await git(path).raw("reset", "--hard", `origin/${target}`);
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

export { mergeProcess };

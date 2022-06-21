const fs = require("fs");

export function wait(millis) {
  return new Promise((res) => setTimeout(res, millis));
}
export function getLocalRepository(config, location) {
  if (!config.repos || config.repos.length === 0) {
    console.log(`ERROR: URL Not Found`);
    return null;
  }
  const matchedRepo = config.repos.find((repo) =>
    location.startsWith(repo.url)
  );
  if (!matchedRepo) {
    console.log(`ERROR: URL Not Found`);
    return null;
  }
  return matchedRepo;
}
export function writeConfigFile(res, configPath, jsonData) {
  fs.writeFile(
    configPath,
    JSON.stringify(jsonData),
    {
      encoding: "utf8",
      flag: "w",
      mode: 0o666,
    },
    (err) => {
      if (err) res.status(400).send(err);
      else res.status(200).send(jsonData);
    }
  );
}

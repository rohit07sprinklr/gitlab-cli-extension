const fs = require("fs");
const path = require("path");

async function getProfiles(res) {
  const configPath = path.join(__dirname, "config.json");
  fs.readFile(configPath, function (err, data) {
    if (err) {
      res.status(400).send(err);
      return;
    }
    const jsonData = JSON.parse(data);
    res.status(200).send(jsonData);
  });
}

async function addProfile(profileData, res) {
  const configPath = path.join(__dirname, "config.json");
  let jsonData;
  fs.readFile(configPath, function (err, data) {
    if (err) {
      jsonData = {};
      jsonData["repos"] = [];
    } else {
      jsonData = JSON.parse(data);
    }
    jsonData.repos.push(profileData);
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
        else {
          res.status(200).send(jsonData);
        }
      }
    );
  });
}

async function deleteProfile(profileID, res) {
  const configPath = path.join(__dirname, "config.json");
  fs.readFile(configPath, function (err, data) {
    if (err) {
      res.status(400).send(err);
      return;
    }
    const jsonData = JSON.parse(data);
    if (profileID > -1) {
      jsonData.repos.splice(profileID, 1);
    }
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
  });
}

export { getProfiles, addProfile, deleteProfile };

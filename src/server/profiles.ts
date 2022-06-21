const fs = require("fs");
const path = require("path");

import { writeConfigFile } from "./utils";

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
    writeConfigFile(res, configPath, jsonData);
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
    writeConfigFile(res, configPath, jsonData);
  });
}

async function updateProfile(profileID, profileData, res) {
  const configPath = path.join(__dirname, "config.json");
  fs.readFile(configPath, function (err, data) {
    if (err) {
      res.status(400).send(err);
      return;
    }
    const jsonData = JSON.parse(data);
    if (profileID > -1) {
      jsonData.repos[profileID] = profileData;
    }
    writeConfigFile(res, configPath, jsonData);
  });
}

export { getProfiles, addProfile, deleteProfile, updateProfile };

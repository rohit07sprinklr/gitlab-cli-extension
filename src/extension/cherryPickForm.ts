import { fetchStream, streamBody } from "./fetchStream";
import { getSearchQueryParams } from "./utils";
import { isOpenMergeRequest } from "./api";

function onCherryPickPause(jsonFormdata, currentCommitId) {
  jsonFormdata.commits = jsonFormdata.commits.slice(currentCommitId);
  jsonFormdata.requestType = "continue";
  const form = document.querySelector(".commit-form");
  const continueButton = document.createElement("button");

  continueButton.classList.add("btn", "btn-outline-primary", "btn-continue");
  continueButton.innerText = "Continue";
  continueButton.style.marginLeft = "10px";
  continueButton.setAttribute("type", "button");

  const stopButton = document.createElement("button");

  stopButton.classList.add("btn", "btn-outline-danger", "btn-stop");
  stopButton.innerText = "Stop";
  stopButton.style.marginLeft = "10px";
  stopButton.setAttribute("type", "button");

  stopButton.addEventListener("click", () => {
    window.location.reload();
  });

  continueButton.addEventListener("click", async () => {
    form.removeChild(continueButton);
    form.removeChild(stopButton);
    cherryPickRequest(jsonFormdata);
  });
  form.appendChild(continueButton);
  form.appendChild(stopButton);

  const copyButton = document.querySelector(".copy-button");
  if (copyButton) {
    copyButton.addEventListener("click", () => {
      const copyText = document.getElementById("gitCopyMessage");
      navigator.clipboard.writeText(copyText.innerText);
    });
  }
}
function onCherryPickComplete(commitBranch, targetBranch, url) {
  const form = document.querySelector(".commit-form");
  const completeButton = document.createElement("button");

  completeButton.classList.add("btn", "btn-outline-primary", "btn-complete");
  completeButton.innerText = "Create Merge Request";
  completeButton.style.marginLeft = "10px";
  completeButton.setAttribute("type", "button");

  const repoURLName = new URL(url).pathname.slice(1);
  const origin = new URL(url).origin;
  const searchQuery = window.location.search.slice(1);
  const searchQueryParams = getSearchQueryParams(searchQuery);
  const csrf_token = searchQueryParams.csrf_token;
  completeButton.addEventListener("click", async () => {
    try{
      const projectInfo = await isOpenMergeRequest(
        repoURLName,
        csrf_token,
        commitBranch,
        targetBranch,
        origin
      );
      if(projectInfo.length === 0){
      window.open(
          `${url}/-/merge_requests/new?create_cherrypick_commit=true&target_branch=${encodeURIComponent(
            targetBranch
          )}&commit_branch=${encodeURIComponent(commitBranch)}`
        );
      }else{
        setContentInDesc(`<strong>There already exist a OPEN Merge Request from ${commitBranch} to ${targetBranch}</strong>`);
      }
    }catch(e){
      setContentInDesc(e.toString());
    }
  });
  form.appendChild(completeButton);
}
async function cherryPickRequest(jsonFormdata) {
  disableFormButton();
  try {
    await fetchStream(
      `http://localhost:4000/cherrypick`,
      "POST",
      jsonFormdata,
      (chunkString) => {
        if (chunkString.toLowerCase().startsWith("paused")) {
          const currentCommitId = Number(
            chunkString.slice(chunkString.indexOf("{") + 1, -1)
          );
          if (currentCommitId > jsonFormdata.commits.length) {
            return;
          }
          onCherryPickPause(jsonFormdata, currentCommitId);
        } else if (chunkString.toLowerCase().startsWith("completed")) {
          setContentInDesc(chunkString);
          onCherryPickComplete(
            jsonFormdata.commitBranch,
            jsonFormdata.targetBranch,
            jsonFormdata.url
          );
        } else {
          setContentInDesc(chunkString);
        }
      }
    ).then((res) => {
      if (!document.querySelector(".btn-continue")) {
        enableFormButton();
      }
    });
  } catch (e) {
    enableFormButton();
  }
}
async function cherryPickCommits(url, path, commitBranch, targetBranch) {
  const table = document.querySelector(".table");
  const jsonFormdata = {};
  jsonFormdata.commits = [];
  jsonFormdata.localPath = path;
  jsonFormdata.commitBranch = commitBranch;
  jsonFormdata.targetBranch = targetBranch;
  jsonFormdata.requestType = "new";
  jsonFormdata.url = url;

  Array.from(table.rows).forEach((element, rowNumber) => {
    if (rowNumber > 0) {
      jsonFormdata.commits.push({
        commitID: rowNumber,
        commitScope: element.cells[0].firstChild.checked,
        commitSHA: element.cells[1].firstChild.value,
      });
    }
  });
  cherryPickRequest(jsonFormdata);
}

function setContentInDesc(content) {
  const el = document.getElementById("cherry-pick-desc");
  el.style.display = "block";
  el.innerHTML = content;
}
function disableFormButton() {
  const buttons = document.querySelectorAll("button");
  buttons.forEach((button) => {
    button.setAttribute("disabled", "true");
  });
}
function enableFormButton() {
  const buttons = document.querySelectorAll("button");
  buttons.forEach((button) => {
    button.removeAttribute("disabled");
  });
}
function addFormBody(commit) {
  return `
<td><input type="checkbox" checked=true style="height:20px;"></td>
<td><input type="text" class="form-control" id="commitsha" value="${commit.commitSHA}" readonly=true></td>
<td><input type="text" class="form-control" id="commitdate" value="${commit.commitDate}" readonly=true></td>
<td><input type="text" class="form-control" id="commitmessage" value="${commit.commitMessage}" readonly=true></td>
`;
}
function addFormHeader(tableHead) {
  const formHeader = document.createElement("tr");
  formHeader.innerHTML = `
  <th scope="col" style="width:5%">Checkbox</th>
  <th scope="col" style="width:10%">Commit_SHA</th>
  <th scope="col">Commit Date</th>
  <th scope="col">Commit Message</th>`;
  tableHead.appendChild(formHeader);
}
function renderForm(commits, url, path, commitBranch, targetBranch) {
  setContentInDesc(`${commits.length} Merge Commits Found!`);
  if (!commits.length) {
    return;
  }
  const form = document.createElement("form");
  form.classList.add("commit-form");

  const tableDiv = document.createElement("div");
  tableDiv.style.maxHeight = "350px";
  tableDiv.style.overflowY = "scroll";
  form.appendChild(tableDiv);

  const table = document.createElement("table");
  table.classList.add("table");
  tableDiv.appendChild(table);

  const tableHead = document.createElement("thead");
  table.appendChild(tableHead);
  addFormHeader(tableHead);

  const tableBody = document.createElement("tbody");
  table.appendChild(tableBody);
  commits.forEach((commit) => {
    const tableRow = document.createElement("tr");
    tableRow.style.height = "5%";
    tableBody.append(tableRow);
    tableRow.innerHTML = addFormBody(commit);
  });

  const cherryPickButton = document.createElement("button");
  cherryPickButton.classList.add("btn", "btn-primary", "btn-cherry-pick");
  cherryPickButton.setAttribute("type", "submit");
  cherryPickButton.innerText = "Cherry Pick";
  form.appendChild(cherryPickButton);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const completeButton = document.querySelector('.btn-complete');
    if(completeButton != null){
      form.removeChild(completeButton);
    }
    await cherryPickCommits(url, path, commitBranch, targetBranch);
  });
  document.body.appendChild(form);
}

const main = () => {
  const cherryPickForm = document.querySelector(".cherry-pick-form");
  cherryPickForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    disableFormButton();
    const searchQuery = window.location.search.slice(1);
    const searchQueryParams = getSearchQueryParams(searchQuery);
    const currentURL = searchQueryParams.currentURL;
    const formData = new FormData(e.target);
    const jsonFormdata = [...formData].reduce((jsonData, [key, value]) => {
      jsonData[key] = value;
      return jsonData;
    }, {});
    jsonFormdata["location"] = currentURL;
    const commitForm = document.querySelector(".commit-form");
    if (commitForm != null) {
      document.body.removeChild(commitForm);
    }
    setContentInDesc(`Fetching Merge Commits`);
    try {
      const res = await fetch(`http://localhost:4000/mergecommits`, {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(jsonFormdata),
      });
      const jsonResult = await res.json();
      if (jsonResult["ERROR"]) {
        throw new Error(jsonResult["ERROR"]);
      }
      enableFormButton();
      renderForm(
        jsonResult.commits,
        jsonResult.url,
        jsonResult.path,
        jsonFormdata.commitBranch,
        jsonFormdata.targetBranch
      );
    } catch (e) {
      enableFormButton();
      setContentInDesc(e);
    }
  });
};

main();

export {};

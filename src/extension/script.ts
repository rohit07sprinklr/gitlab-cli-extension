import { fetchStream, streamBody } from "./fetchStream";

import { getCurrentTab } from "./utils";

async function cherryPickRequest(jsonFormdata) {
  disableButton();
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
          let jsonFormdataNew = jsonFormdata;
          jsonFormdataNew.commits =
            jsonFormdataNew.commits.slice(currentCommitId);
          const form = document.querySelector(".commit-form");
          const continueButton = document.createElement("button");

          continueButton.classList.add("btn", "btn-primary", "btn-continue");
          continueButton.innerText = "Continue";
          continueButton.style.marginLeft = "10px";

          continueButton.addEventListener("click", async () => {
            form.removeChild(continueButton);
            cherryPickRequest(jsonFormdata);
          });
          form.appendChild(continueButton);
        } else {
          setContentInDesc(chunkString);
        }
      }
    ).then((res) => {
      if (!document.querySelector(".btn-continue")) {
        enableButton();
      }
    });
  } catch (e) {
    enableButton();
  }
}
async function cherryPickCommits(path, commitBranch, targetBranch) {
  const table = document.querySelector(".table");
  const jsonFormdata = {};
  jsonFormdata.commits = [];
  jsonFormdata.localPath = path;
  jsonFormdata.commitBranch = commitBranch;
  jsonFormdata.targetBranch = targetBranch;

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
  el.textContent = content;
}
function disableButton() {
  const buttons = document.querySelectorAll("button");
  buttons.forEach((button) => {
    button.setAttribute("disabled", "true");
  });
}
function enableButton() {
  const buttons = document.querySelectorAll("button");
  buttons.forEach((button) => {
    button.removeAttribute("disabled");
  });
}
function renderFormElement(commit) {
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
function renderForm(commits, path, commitBranch, targetBranch) {
  setContentInDesc(`${commits.length} Merge Commits Found!`);
  if (!commits.length) {
    return;
  }
  const form = document.createElement("form");
  form.classList.add("commit-form");

  const tableDiv = document.createElement("div");
  tableDiv.style.height = "350px";
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
    tableRow.innerHTML = renderFormElement(commit);
  });

  const cherryPickButton = document.createElement("button");
  cherryPickButton.classList.add("btn", "btn-primary", "btn-cherry-pick");
  cherryPickButton.setAttribute("type", "submit");
  cherryPickButton.innerText = "Cherry Pick";
  form.appendChild(cherryPickButton);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    await cherryPickCommits(path, commitBranch, targetBranch);
  });
  document.body.appendChild(form);
}

const main = () => {
  const cherryPickForm = document.querySelector(".cherry-pick-form");
  cherryPickForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const currentTab = await getCurrentTab();
    const formData = new FormData(e.target);
    const jsonFormdata = {};
    formData.forEach((value, key) => (jsonFormdata[key] = value));
    const currentURL = new URL(currentTab.url).search.split("=")[1];
    jsonFormdata["location"] = `${currentURL}`;
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
      const commitForm = document.querySelector(".commit-form");
      if (commitForm != null) {
        document.body.removeChild(commitForm);
      }
      renderForm(
        jsonResult.commits,
        jsonResult.path,
        jsonFormdata.commitBranch,
        jsonFormdata.targetBranch
      );
    } catch (e) {
      setContentInDesc(e);
    }
  });
};

main();

export {};

import { fetchStream, streamBody } from "./fetchStream";
function streamBody(body, onChunkReceive) {
  const decoder = new TextDecoder("utf-8");

  return Promise.resolve(body)
    .then((rs) => {
      // @ts-ignore
      const reader = rs.getReader();

      return new ReadableStream({
        async start(controller) {
          while (true) {
            const { done, value } = await reader.read();

            // When no more data needs to be consumed, break the reading
            if (done) {
              break;
            }

            // Enqueue the next data chunk into our target stream
            controller.enqueue(value);
            const chunkString = decoder.decode(value, { stream: true });
            if (chunkString.toLowerCase().startsWith("error")) {
              onChunkReceive(chunkString);
              throw Error(chunkString);
            }
            onChunkReceive(chunkString);
          }

          // Close the stream
          controller.close();
          reader.releaseLock();
        },
      });
    })
    .then((rs) => new Response(rs))
    .then((response) => response.text());
}

function fetchStream(url, payload, onChunkReceive) {
  return fetch(url, {
    method: "POST",
    mode: "cors",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })
    .then((r) => {
      if (r.status >= 400) {
        return r.text().then((text) => {
          throw Error(text);
        });
      }
      return r.body;
    })
    .catch((e) => {
      onChunkReceive(e);
      throw e;
    })
    .then((body) => streamBody(body, onChunkReceive));
}
async function cherryPickCommits() {
  const table = document.querySelector(".table");
  const jsonFormdata = {};
  jsonFormdata.commits = [];
  Array.from(table.rows).forEach((element, rowNumber) => {
    if (rowNumber > 0) {
      jsonFormdata.commits.push({
        id: rowNumber,
        scope: element.cells[0].firstChild.checked,
        commitSHA: element.cells[1].firstChild.value,
      });
    }
  });
  console.log(jsonFormdata);
}
function setContentInDesc(content) {
  const el = document.getElementById("cherry-pick-desc");
  el.style.display = "block";
  el.textContent = content;
}

async function getCurrentTab() {
  const queryOptions = { active: true, lastFocusedWindow: true };
  const [tab] = await chrome.tabs.query(queryOptions);
  return tab;
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
function renderForm(commits) {
  const form = document.createElement("form");
  form.classList.add("commit-form");
  const table = document.createElement("table");
  table.classList.add("table");
  form.appendChild(table);
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
    const formData = new FormData(e.target);
    await cherryPickCommits(formData);
  });
  document.body.appendChild(form);
}
const cherryPickForm = document.querySelector(".cherry-pick-form");
cherryPickForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const currentTab = await getCurrentTab();
  const formData = new FormData(e.target);
  const jsonFormdata = {};
  formData.forEach((value, key) => (jsonFormdata[key] = value));
  const currentURL = new URL(currentTab.url).search.split("=")[1];
  jsonFormdata["location"] = `${currentURL}`;
  // try {
  //     await fetchStream(
  //       `http://localhost:4000/cherrypick`,jsonFormdata ,
  //       (chunkString) => {
  //         setContentInDesc(chunkString);
  //       }
  //     ).then((res) => {
  //       const responseArray = res.replaceAll('!',`\n`);
  //       setContentInDesc(responseArray);
  //     });
  //   }catch(e){

  //   }
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
    renderForm(jsonResult.commits);
  } catch {}
});

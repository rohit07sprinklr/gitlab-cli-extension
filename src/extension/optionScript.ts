function setContentInDesc(content) {
  const el = document.getElementById("options-desc");
  if (content.toString().trim() === "") {
    el.style.display = "none";
    return;
  }
  el.style.display = "block";
  el.textContent = content;
}
async function deleteProfile(profileNumber) {
  const res = await fetch(`http://localhost:4000/profiles`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id: profileNumber }),
  });
  if (res.status === 400) {
    setContentInDesc(`Delete Failed`);
    return;
  }
  renderProfiles();
}
function renderFormElement(profile) {
  return `
<td><input type="text" class="form-control" id="profile-url" value="${profile.url}" readonly=true></td>
<td><input type="text" class="form-control" id="profile-path" value="${profile.path}" readonly=true></td>`;
}
function addFormHeader(tableHead) {
  const formHeader = document.createElement("tr");
  formHeader.innerHTML = `
    <th scope="col">Repository URL</th>
    <th scope="col">Local Path</th>
    <th scope="col" style="width:5%">Remove</th>`;
  tableHead.appendChild(formHeader);
}

async function renderProfiles() {
  try {
    const res = await fetch(`http://localhost:4000/profiles`);
    if (res.status === 400) {
      throw new Error(`Config File Missing`);
    }
    const profiles = await res.json();
    const profileForm = document.querySelector('.profile-form');
    if(profileForm != null){
      document.body.removeChild(profileForm);
    }
    setContentInDesc(`${profiles.repos.length} Profiles Found!`);
    if (!profiles.repos.length) {
      document.querySelector(".btn-show-profile").innerText = "Get Active Profiles";
      return;
    }
    const form = document.createElement("form");
    form.classList.add("profile-form");

    const tableDiv = document.createElement("div");
    tableDiv.classList.add("list-profiles");
    tableDiv.style.height = "400px";
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
    profiles.repos.forEach((profile, profileNumber) => {
      const tableRow = document.createElement("tr");
      tableRow.style.height = "5%";
      tableRow.setAttribute("id", profileNumber);
      tableBody.append(tableRow);
      tableRow.innerHTML = renderFormElement(profile);

      const tableColumn = document.createElement("td");
      const deleteButton = document.createElement("button");
      deleteButton.classList.add("btn", "btn-outline-danger");
      deleteButton.setAttribute('type','button');
      deleteButton.addEventListener("click", () => {
        deleteProfile(profileNumber);
      });
      deleteButton.style.marginTop = "5px";
      deleteButton.innerText = "Delete";
      tableColumn.appendChild(deleteButton);
      tableRow.appendChild(tableColumn);
    });
    document.body.appendChild(form);
    document.querySelector(".btn-show-profile").innerText = "Hide Active Profiles";
  } catch (e) {
    setContentInDesc(e);
  }
}
function getProfile() {
  const showProfile = document.querySelector(".btn-show-profile");
  showProfile.addEventListener("click", async () => {
    if (showProfile.innerText === "Hide Active Profiles") {
      const profileForm = document.querySelector(".profile-form");
      if (profileForm != null) {
        document.body.removeChild(profileForm);
      }
      setContentInDesc(" ");
      showProfile.innerText = "Get Active Profiles";
    } else {
      await renderProfiles();
    }
  });
}

function AddProfile() {
  const addProfileForm = document.querySelector(".add-profile-form");
  addProfileForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const jsonFormdata = {};
    formData.forEach((value, key) => (jsonFormdata[key] = value));
    setContentInDesc(`Adding Profile`);
    const res = await fetch(`http://localhost:4000/profiles`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(jsonFormdata),
    });
    if (res.status === 400) {
      throw new Error();
    }
    setContentInDesc(" ");
    addProfileForm.reset();
    renderProfiles();
  });
}
const main = () => {
  getProfile();
  AddProfile();
};
main();
export {};

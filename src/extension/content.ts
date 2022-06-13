import { log } from "./log";

import { fetchStream, streamBody } from "./fetchStream";

import { MR_WIDGET_SECTION,GITLAB_CLI_DESC,GITLAB_CLI_BUTTON } from './constants/domClasses';

import {getMergeRequestInfo,putRebaseRequest} from "./api";

function renderButton() {
  const button = document.createElement("button");
  button.classList.add("btn", "btn-primary", GITLAB_CLI_BUTTON);
  return button;
}

function setContentInDesc(content) {
  const el = document.getElementById(GITLAB_CLI_DESC);
  el.style.display = "block";
  el.textContent = content;
}

function clearContentInDesc() {
  const el = document.getElementById(GITLAB_CLI_DESC);
  el.style.display = "none";
  el.textContent = "";
}

function renderMergeButton(sourceBranch, targetBranch) {
  const button = renderButton();
  button.textContent = "Merge Via CLI";
  button.id = "gitlab-cli-merge";
  button.onclick = async () => {
    disableButtons();
    try {
      await fetchStream(
        `http://localhost:4000/merge?location=${
          window.location
        }&source=${encodeURIComponent(
          sourceBranch!
        )}&target=${encodeURIComponent(targetBranch!)}`,
        (chunkString) => {
          button.textContent = "Merging";
          setContentInDesc(chunkString);
        }
      ).then((res) => {
        button.textContent = "Merged";
        window.location.reload();
      });
    } catch (e) {
      enableButtons();
      button.textContent = "Retry Merge";
      setContentInDesc(e);
    }
  };
  const buttonGroup = document.querySelector(".mr-widget-section .d-flex");
  buttonGroup.appendChild(button);
}

function renderRebaseButton(repoURLName, mergeRequestID) {
  const button = renderButton();
  button.textContent = "Rebase";
  button.id = "gitlab-cli-rebase";
  button.onclick = async () => {
    disableButtons();
    try{
      button.textContent = "Rebasing";
      setContentInDesc(`Requesting the Gitlab API`);
      const res = await putRebaseRequest(repoURLName,mergeRequestID,setContentInDesc);
      if(res.merge_error==null){
          setContentInDesc(`Rebase Successful!`);
          button.textContent = "Rebased";
          window.location.reload();
      }
      else{
          throw new Error(`${res.merge_error}`);
      }
    }
    catch(e){
      enableButtons();
      button.textContent = "Retry Rebase";
      setContentInDesc(e);
    }
  };
  const buttonGroup = document.querySelector(".mr-widget-section .d-flex");
  button.style.marginLeft = "10px";
  buttonGroup.appendChild(button);
}

function renderDescription() {
  const descriptionAreaEl = document.createElement("p");
  descriptionAreaEl.id = GITLAB_CLI_DESC;
  descriptionAreaEl.style.display = "none";
  descriptionAreaEl.style.borderRadius = "4px";
  descriptionAreaEl.style.marginTop = "10px";
  descriptionAreaEl.style.marginBottom = "0px";

  descriptionAreaEl.style.border = "1px solid #e5e5e5";
  descriptionAreaEl.style.backgroundColor = "#fafafa";
  descriptionAreaEl.style.padding = "12px";
  return descriptionAreaEl;
}

function render() {
  const rootDiv = document.createElement("div");
  rootDiv.style.display='flex';
  rootDiv.style.flexDirection='column';
  rootDiv.style.marginLeft='auto';
  rootDiv.style.marginRight='auto';
  rootDiv.style.marginTop='16px';
  rootDiv.classList.add("mr-widget-heading", "append-bottom-default");
  rootDiv.style.border='none';

  const containerDiv = document.createElement("div");
  containerDiv.classList.add("mr-widget-content");

  const buttonGroup = document.createElement("div");
  buttonGroup.classList.add("d-flex");

  containerDiv.appendChild(buttonGroup);
  containerDiv.appendChild(renderDescription());

  rootDiv.appendChild(containerDiv);
  return rootDiv;
}


function getButtons() {
  return document.querySelectorAll("."+GITLAB_CLI_BUTTON);
}

function disableButtons() {
  getButtons().forEach((el) => {
    el.disabled = true;
  });
}

function enableButtons() {
  getButtons().forEach((el) => {
    el.disabled = false;
  });
}
function wait(millis) {
  return new Promise((res) => setTimeout(res, millis));
}

async function getIsRebaseCompleted(repoURLName,mergeRequestID){
  while(true){
    try{
        const statusResponse = await getMergeRequestInfo(repoURLName,mergeRequestID);
        if(statusResponse.rebase_in_progress==false){
            return statusResponse;
        }
        await wait(5000);
    }catch(error){
        return error;
    }
  }
}

async function initialise(repoURLName,mergeRequestID,sourceBranch,targetBranch,isRebaseInProgress) {
  const referenceEl = document.querySelector(MR_WIDGET_SECTION);
  const el = render();
  referenceEl.classList.add("mr-widget-workflow");
  referenceEl.prepend(el);

  renderMergeButton(sourceBranch,targetBranch);
  const mergeButton = document.getElementById('gitlab-cli-merge');
  disableButtons();
  mergeButton.classList.remove(GITLAB_CLI_BUTTON);
  renderRebaseButton(repoURLName, mergeRequestID);
  if(isRebaseInProgress==true){
    disableButtons();
    await getIsRebaseCompleted(repoURLName,mergeRequestID);
    enableButtons();
  }

  try{
    await fetch(`http://localhost:4000/handshake?location=${window.location}`)
    .then((r) => {
    if (r.status === 200) {
      const mergeButton = document.getElementById('gitlab-cli-merge');
      mergeButton.classList.add(GITLAB_CLI_BUTTON);
      enableButtons();
      return true;
    }
    if (r.status === 500) {
      return false;
    }
    if (r.status === 512) {
      const descEl = document.getElementById(GITLAB_CLI_DESC);
      setContentInDesc("CLI busy");
      streamBody(r.body, (chunkString) => {
        descEl.textContent = chunkString;
      }).then(() => {
        clearContentInDesc();
        const mergeButton = document.getElementById('gitlab-cli-merge');
        mergeButton.classList.add(GITLAB_CLI_BUTTON);
        enableButtons();
      });
      return false;
    }
    return false;
    });
  }catch{
    console.log('Server not initialised!');
    setContentInDesc(`Server not initialised, Merge via CLI Disabled, Rebase Enabled!`);
  }
}

function getProjectInfo(pathName){
  let pathArray = pathName.split("/");
  const midIndex = pathArray.findIndex((element)=>{
    return element == 'merge_requests';
  })
  const repoURLIndex = pathArray.slice(1,midIndex-1);
  const repoURLName = repoURLIndex.join('/');
  return { mergeRequestID: pathArray.at(midIndex+1), repoURLName};
}
async function renderWidget(projectInfo){
  let retryCounter = 1;
  while(retryCounter<=2){
    try{
      let res = await getMergeRequestInfo(projectInfo.repoURLName,projectInfo.mergeRequestID);
      if(!res.isMerged){
        initialise(projectInfo.repoURLName,projectInfo.mergeRequestID,res.sourceBranch,res.targetBranch,res.isRebaseInProgress);
        return;
      }
    }catch(e){
        console.log(e);
    }
    await wait(2000);
    retryCounter+=1;
  }
}
const main = () => {
  log("init");
  const pathName = window.location.pathname;
  const projectInfo = getProjectInfo(pathName);
  
  const targetNode = document.querySelector('.issuable-discussion');
  const config = { childList: true, subtree: true };

  const callback = function(mutationList, observer) {
  for(const mutation of mutationList) {
      if(mutation.target.classList.contains('mr-widget-section')){
        log('Widget section loaded');
        observer.disconnect();
        renderWidget(projectInfo);
        break;
      }
  }
  };

  const observer = new MutationObserver(callback);
  observer.observe(targetNode, config);
};

window.addEventListener ("load", main, false);

export {};

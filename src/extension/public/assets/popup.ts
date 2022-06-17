import { getCurrentTab } from "../../utils";

document
  .getElementById("btn-cherry-pick")
  .addEventListener("click", async () => {
    const currentTab = await getCurrentTab();
    window.open(
      chrome.runtime.getURL(`cherrypick.html?projectURL=${currentTab.url}`)
    );
  });

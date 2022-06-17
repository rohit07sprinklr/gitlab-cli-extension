async function getCurrentTab() {
  const queryOptions = { active: true, lastFocusedWindow: true };
  const [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}
document
  .getElementById("btn-cherry-pick")
  .addEventListener("click", async () => {
    const currentTab = await getCurrentTab();
    window.open(
      chrome.runtime.getURL(`cherrypick.html?projectURL=${currentTab.url}`)
    );
  });

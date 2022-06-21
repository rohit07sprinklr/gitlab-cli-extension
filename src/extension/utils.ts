async function getCurrentTab() {
  const queryOptions = { active: true, lastFocusedWindow: true };
  const [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}
async function fetchProfileRequest(jsonInputBody, method) {
  const PORT = 4000;
  if (method === "GET") {
    return fetch(`http://localhost:${PORT}/profiles`);
  }
  return fetch(`http://localhost:${PORT}/profiles`, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(jsonInputBody),
  });
}
export { getCurrentTab, fetchProfileRequest };

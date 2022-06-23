async function fetchAPIBuilder(method, path, ORIGIN, csrf_token) {
  return fetch(`${ORIGIN}/api/v4/${path}`, {
    headers: {
      accept: "application/json, text/plain, */*",
      "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
      "if-none-match": 'W/"ed967adadfc0526fcaa930dbb9a2b336"',
      "sec-ch-ua":
        '" Not;A Brand";v="99", "Google Chrome";v="91", "Chromium";v="91"',
      "sec-ch-ua-mobile": "?0",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "x-csrf-token": csrf_token,
      "x-requested-with": "XMLHttpRequest",
    },
    referrer: window.location.toString(),
    referrerPolicy: "strict-origin-when-cross-origin",
    body: null,
    method,
    mode: "cors",
    credentials: "include",
  });
}
async function fetchCLIBuilder(method, path, ORIGIN, jsonInputBody) {
  if (method === "GET") {
    return fetch(`${ORIGIN}/${path}`);
  }
  return fetch(`${ORIGIN}/${path}`, {
    method,
    mode: "cors",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(jsonInputBody),
  });
}
export async function GET(ORIGN, path, csrf_token, requestType) {
  if (requestType === "APIRequest") {
    return fetchAPIBuilder("GET", path, ORIGN, csrf_token);
  }
  return fetchCLIBuilder("GET", path, ORIGN, null);
}
export async function POST(ORIGN, path, requestType, jsonInputBody) {
  return fetchCLIBuilder("POST", path, ORIGN, jsonInputBody);
}
export async function DELETE(ORIGN, path, requestType, jsonInputBody) {
  return fetchCLIBuilder("DELETE", path, ORIGN, jsonInputBody);
}
export async function PUT(ORIGN, path, requestType, jsonInputBody) {
  return fetchCLIBuilder("PUT", path, ORIGN, jsonInputBody);
}
export * as ajaxClient from "./ajaxClient";

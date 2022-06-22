async function fetchBuilder(method,path,ORIGIN,csrf_token){
    return fetch(`${ORIGIN}/api/v4/${path}`,
    {
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
    })
}
export async function GET(path,ORIGN,csrf_token){
    return fetchBuilder('GET',path,ORIGN,csrf_token);
}
export * as ajaxClient from "./ajaxClient"
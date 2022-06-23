import { ajaxClient } from "./ajaxClient";

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

function fetchBuilder(origin,path, method, payload) {
  if (method === "GET") {
    return ajaxClient.GET(origin,path,'','CLIRequest');
  } else if (method === "POST") {
    return ajaxClient.POST(origin,path,'CLIRequest',payload);
  }
}

function fetchStream(origin,path, method, payload, onChunkReceive) {
  return fetchBuilder(origin,path, method, payload)
    .then((r) => {
      if (r.status >= 400) {
        return r.text().then((text) => {
          throw Error(text);
        });
      }
      return r.body;
    })
    .catch((e) => {
      onChunkReceive(e.toString());
      throw e;
    })
    .then((body) => streamBody(body, onChunkReceive));
}

export { fetchStream };
export { streamBody };

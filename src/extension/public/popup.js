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
              if (chunkString === "ERROR") {
                throw Error(chunkString);
                return;
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
      .then((response) => response.text())
      .catch((e)=>{
        throw e;
      });
  }
  
  function fetchStream(url, payload, onChunkReceive) {
    return fetch(url,{
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
      .then((r) => {
        if (r.status >= 400) {
          return r.text().then((text) => {
            throw Error(text);
          });
        }
        return r.body;
      })
      .then((body) => streamBody(body, onChunkReceive));
  }

  function setContentInDesc(content) {
    const el = document.getElementById('cherry-pick-desc');
    el.style.display = "block";
    el.textContent = content;
  }

const cherryPickForm = document.querySelector('.cherry-pick-form');
cherryPickForm.addEventListener('submit',async(e)=>{
    e.preventDefault();
    const formData = new FormData(e.target);
    const jsonFormdata = {};
    formData.forEach((value, key) => (jsonFormdata[key] = value));
    try {
        await fetchStream(
          `http://localhost:4000/cherrypick`,jsonFormdata ,
          (chunkString) => {
            setContentInDesc(chunkString);
          }
        ).then((res) => {
          // window.location.reload();
        });
      } catch (e) {
        setContentInDesc(e);
      }
})
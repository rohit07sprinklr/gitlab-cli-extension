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
              if (chunkString.toLowerCase().startsWith('error')) {
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
      .then((response) => response.text())
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
      }).catch(e=>{
        onChunkReceive(e);
        throw e;
      }).then((body) => streamBody(body, onChunkReceive));
  }

  function setContentInDesc(content) {
    const el = document.getElementById('cherry-pick-desc');
    el.style.display = "block";
    el.textContent = content;
  }

  async function getCurrentTab() {
    const queryOptions = { active: true, lastFocusedWindow: true };
    const [tab] = await chrome.tabs.query(queryOptions);
    return tab;
}
document.addEventListener('DOMContentLoaded',async ()=>{
  const currentTab = await getCurrentTab();
  if(currentTab.url.indexOf('gitlab') > -1){
      document.body.style.display='block';
  }
});
const cherryPickForm = document.querySelector('.cherry-pick-form');
cherryPickForm.addEventListener('submit',async(e)=>{
    e.preventDefault();
    const currentTab = await getCurrentTab();
    const formData = new FormData(e.target);
    const jsonFormdata = {};
    formData.forEach((value, key) => (jsonFormdata[key] = value));
    jsonFormdata['location'] = currentTab.url;
    try {
        await fetchStream(
          `http://localhost:4000/cherrypick`,jsonFormdata ,
          (chunkString) => {
            setContentInDesc(chunkString);
          }
        ).then((res) => {
          const responseArray = res.replaceAll('!',`\n`);
          setContentInDesc(responseArray);
        });
      }catch(e){

      }
    }
)
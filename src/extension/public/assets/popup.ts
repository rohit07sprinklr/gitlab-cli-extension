import {fetchStream,streamBody} from '../../fetchStream';

import {getCurrentTab} from '../../utils';


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
        `http://localhost:4000/cherrypick`,'POST',jsonFormdata ,
        (chunkString) => {
          setContentInDesc(chunkString);
        }
      ).then((res) => {
        const responseArray = res.replaceAll('!',`\n`);
        setContentInDesc(responseArray);
      });
    }catch(e){

    }
})
const generateToken= document.getElementById('generate_cli_token');
async function getCurrentTab() {
    let queryOptions = { active: true, lastFocusedWindow: true };
    let [tab] = await chrome.tabs.query(queryOptions);
    return tab;
}
document.addEventListener('DOMContentLoaded',async ()=>{
    const currentTab = await getCurrentTab();
    if(currentTab.url.indexOf('gitlab') > -1){
        generateToken.style.display='block';
    }
});
generateToken.addEventListener('click',async ()=>{
    const currentTab = await getCurrentTab();
    const currentURL = new URL(currentTab.url);
    const ORIGN = currentURL.origin;
    chrome.storage.sync.set({ 'gitTokenCopy':true });
    chrome.tabs.create({active: true, url: `${ORIGN}/-/profile/personal_access_tokens?create_gitlabcli_token=true`});
})

function updateToken(){
    const privateTokenInput = form.elements['private-token'];
    try{
        chrome.storage.sync.get(['gitToken'], function(items) {
            if(!(items.gitToken) || (items.gitToken).trim() === ''){
                privateTokenInput.value = 'No Tokens Found!'
            }
            else
            privateTokenInput.value = items.gitToken;
        });
    }catch{
        console.log('failed');
    }
}
window.onload = ()=>{
    updateToken();
}

const form = document.getElementById('token-form');
form.addEventListener('submit',async (e)=>{
    e.preventDefault();
    const ele = form.elements['private-token'];
    const gitToken = ele.value;
    try{
        chrome.storage.sync.set({ gitToken });
        const successhandler= document.getElementById('status-successhandler');
        successhandler.style.display = 'block';
        setTimeout(()=>{
            successhandler.style.display = 'none';
        },500);
    }catch{
        const errorhandler= document.getElementById('status-errorhandler');
        errorhandler.style.display = 'block';
        setTimeout(()=>{
            errorhandler.style.display = 'none';
        },500);
    }
});

document.getElementById('form-cleartoken').addEventListener('click',async (e)=>{
    const gitToken = '';
    chrome.storage.sync.set({ gitToken });
    updateToken();
});
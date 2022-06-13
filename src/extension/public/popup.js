const generateToken= document.querySelector('.generate-cli-token');
async function getCurrentTab() {
    const queryOptions = { active: true, lastFocusedWindow: true };
    const [tab] = await chrome.tabs.query(queryOptions);
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

function renderTokenValue(){
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
    renderTokenValue();
}

const form = document.querySelector('form');
form.addEventListener('submit',async (e)=>{
    e.preventDefault();
    const ele = form.elements['private-token'];
    const gitToken = ele.value;
    try{
        chrome.storage.sync.set({ gitToken });
        const successhandler= document.querySelector('.status-success-handler');
        successhandler.style.display = 'block';
    }catch{
        const errorhandler= document.querySelector('.status-error-handler');
        errorhandler.style.display = 'block';
    }
});

document.getElementById('form-clear-token').addEventListener('click',async (e)=>{
    const gitToken = '';
    chrome.storage.sync.set({ gitToken });
    renderTokenValue();
});
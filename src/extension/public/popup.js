const generateToken= document.getElementById('generate_cli_token');
generateToken.addEventListener('click',()=>{
    chrome.tabs.create({active: true, url: "https://gitlab.com/-/profile/personal_access_tokens?create_gitlabcli_token=true"});
})

function updateToken(){
    const privateTokenInput = form.elements['private-token'];
    try{
        chrome.storage.sync.get(['gitToken'], function(items) {
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
        },2000);
    }catch{
        const errorhandler= document.getElementById('status-errorhandler');
        errorhandler.style.display = 'block';
        setTimeout(()=>{
            errorhandler.style.display = 'none';
        },2000);
    }
});

document.getElementById('form-cleartoken').addEventListener('click',async (e)=>{
    const gitToken = '';
    chrome.storage.sync.set({ gitToken });
    updateToken();
});
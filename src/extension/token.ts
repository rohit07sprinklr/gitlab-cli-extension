const main = () => {
    const windowURL = new URL(window.location);
    if(windowURL.searchParams.toString()=='create_gitlabcli_token=true'){
        const inputArray = Array.from(document.querySelectorAll('input'))

        const scopes = inputArray.filter(input => input.name === 'personal_access_token[scopes][]')
        scopes.forEach((element)=>{
            element.setAttribute("checked",true);
        })
        
        const tokenName = inputArray.filter(input => input.name === 'personal_access_token[name]');
        tokenName.forEach((element)=>{
            element.value = 'GitlabCLIToken';
        })

        const tokenExpireDate = inputArray.filter(input => input.name === 'personal_access_token[expires_at]');
        const today = new Date();
        const date = (today.getFullYear()+1)+'-'+("0" + (today.getMonth()+1)).slice(-2)+'-'+("0" + (today.getDate()+1)).slice(-2);
        tokenExpireDate.forEach((element)=>{
            element.value = date;
        })

        const submitButton = inputArray.filter(input => input.name === 'commit');
        submitButton.forEach((element)=>{
            element.classList.remove('disabled');
            element.removeAttribute("disabled");
            element.click();
        })
    }
    else{
        const token = document.querySelector(".created-personal-access-token-container");
        if(token!=null){
            try{
                chrome.storage.sync.get(['gitTokenCopy'], function(items) {
                    if(!!(items.gitTokenCopy) || (items.gitTokenCopy) === true){
                        const tokenBox = document.getElementById('created-personal-access-token');
                        const tokenID = tokenBox.value;
                        chrome.storage.sync.set({ 'gitToken': tokenID });
                        chrome.storage.sync.set({ 'gitTokenCopy': false });
                    }
                });
            }catch{
                console.log('failed');
            }
        }
    }
  };
  
  main();
  
  export {};
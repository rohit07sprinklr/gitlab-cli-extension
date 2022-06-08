const main = () => {
    const windowURL = new URL(window.location);
    if(windowURL.searchParams.toString()=='create_gitlabcli_token=true'){
        const scopes = document.querySelectorAll(".custom-control-input");
        scopes.forEach((element)=>{
            element.setAttribute("checked",true);
        })
        const tokenName = document.getElementById('personal_access_token_name');
        tokenName.value = 'GitlabCLIToken';
        const today = new Date();
        const date = (today.getFullYear()+1)+'-'+("0" + (today.getMonth()+1)).slice(-2)+'-'+("0" + (today.getDate()+1)).slice(-2);
        const tokenExpireDate = document.getElementById("personal_access_token_expires_at");
        tokenExpireDate.value = date;
        const submitButton = document.querySelector('input[type="submit"]');
        submitButton.classList.remove('disabled');
        submitButton.removeAttribute("disabled");
        submitButton.click();
    }
    else{
        const token = document.querySelector(".created-personal-access-token-container");
        if(token!=null){
            const tokenBox = document.getElementById('created-personal-access-token');
            const tokenID = tokenBox.value;
            chrome.storage.sync.set({ 'gitToken': tokenID });
            setTimeout(() => {
                window.close();
            }, 800);
        }
    }
  };
  
  main();
  
  export {};
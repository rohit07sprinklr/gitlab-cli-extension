const currentURL = new URL(window.location);
const ORIGIN = currentURL.origin;

async function getPrivateToken(){
    return new Promise((resolve,reject)=>{
        try{
            chrome.storage.sync.get(['gitToken'], function(items) {
                resolve(items.gitToken);
            });
        }catch(e){
            reject(e);
        }
    }) 
}

async function fetchBuilder(method,path){
    const PRIVATE_TOKEN = await getPrivateToken();
    return fetch(`${ORIGIN}/api/v4/${path}`,
    {
        method,
        headers: {
        'PRIVATE-TOKEN': PRIVATE_TOKEN
        }
    })
}
export async function GET(path){
    return fetchBuilder('GET',path);
}
export async function PUT(path){
    return fetchBuilder('PUT',path);
}
export * as ajaxClient from "./ajaxClient"
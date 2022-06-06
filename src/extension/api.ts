import {ajaxClient} from "./ajaxClient";

function wait(millis) {
     return new Promise((res) => setTimeout(res, millis));
}

async function getMergeRequestInfo(repoURLName,mergeRequestID) {
    try{
    const res = await ajaxClient.GET(`projects/${encodeURIComponent(repoURLName)}/merge_requests/${mergeRequestID}`);
    const jsonResponse = await res.json();
    return {sourceBranch: jsonResponse.source_branch,
            targetBranch: jsonResponse.target_branch,
            isMerged: !(jsonResponse.state === 'opened'),
            hasMergeConflict: jsonResponse.has_conflicts};
    }
    catch(e){
    return new Error('Cannot fetch Data for given mergeRequestID');
    }
}

async function putRebaseRequest(repoURLName,mergeRequestID,setContentInDesc){
    try{
        const res = await ajaxClient.PUT(`projects/${encodeURIComponent(repoURLName)}/merge_requests/${mergeRequestID}/rebase`);
        if (res.ok) {
            setContentInDesc(`Rebase request is enqueued successfully`);
            while(true){
                try{
                    const statusResponse = await ajaxClient.GET(`projects/${encodeURIComponent(repoURLName)}/merge_requests/${mergeRequestID}?include_rebase_in_progress=true`);
                    const statusJSONresponse = await statusResponse.json();
                    console.log(statusJSONresponse);
                    if(statusJSONresponse.rebase_in_progress==false){
                        return statusJSONresponse;
                    }
                    await wait(100);
                }catch(e){
                    console.log(e);
                }
            }
        }
        else {
            throw new Error(`You are not authorized! Update your private token!`);
        }
    }
    catch(e){
        return e;
    }
}

export {getMergeRequestInfo,putRebaseRequest}
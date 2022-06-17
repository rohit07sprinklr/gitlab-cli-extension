import {ajaxClient} from "./ajaxClient";

async function getMergeRequestInfo(repoURLName,mergeRequestID) {
    try{
    const res = await ajaxClient.GET(`projects/${encodeURIComponent(repoURLName)}/merge_requests/${mergeRequestID}?include_rebase_in_progress=true`);
    const jsonResponse = await res.json();
    return {sourceBranch: jsonResponse.source_branch,
            targetBranch: jsonResponse.target_branch,
            isMerged: !(jsonResponse.state === 'opened'),
            hasMergeConflict: jsonResponse.has_conflicts,
            isRebaseInProgress: jsonResponse.rebase_in_progress};
    }
    catch(e){
    throw new Error('Cannot fetch Data for given mergeRequestID');
    }
}

export {getMergeRequestInfo}
import { DOMAIN_NAME,PROJECT_ID,PRIVATE_TOKEN } from './constants';

async function getMergeRequestInfo(mergeRequestID) {
    return new Promise((resolve,reject)=>{
        fetch(`https://${DOMAIN_NAME}/api/v4/projects/${PROJECT_ID}/merge_requests/${mergeRequestID}`,
        {
          method: 'GET',
          headers: {
            'PRIVATE-TOKEN': PRIVATE_TOKEN
          }
        })
        .then((res)=>{
        if (res.ok) {
            return res.json();
        }
        throw new Error('Cannot fetch Data for given mergeRequestID');
        })
        .then((res)=> {
        let sourceBranch = res.source_branch;
        let targetBranch = res.target_branch;
        let isMerged = (res.state=='opened')?false:true;
        let hasMergeConflict = res.has_conflicts;
        resolve({sourceBranch,targetBranch,isMerged,hasMergeConflict});
        })
        .catch((e)=>{
        reject(e);
        })
    })
}

export {getMergeRequestInfo}
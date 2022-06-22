import { ajaxClient } from "./ajaxClient";

async function getMergeRequestInfo(repoURLName, mergeRequestID) {
  const csrf_token = document.querySelector('[name="csrf-token"]').content;
  const currentURL = new URL(window.location);
  const ORIGIN = currentURL.origin;
  try {
    const res = await ajaxClient.GET(
      `projects/${encodeURIComponent(
        repoURLName
      )}/merge_requests/${mergeRequestID}?include_rebase_in_progress=true`,
      ORIGIN,
      csrf_token
    );
    const jsonResponse = await res.json();
    return {
      sourceBranch: jsonResponse.source_branch,
      targetBranch: jsonResponse.target_branch,
      isMerged: !(jsonResponse.state === "opened"),
      hasMergeConflict: jsonResponse.has_conflicts,
      isRebaseInProgress: jsonResponse.rebase_in_progress,
    };
  } catch (e) {
    throw new Error(e.toString());
  }
}

async function isOpenMergeRequest(
  repoURLName,
  csrf_token,
  sourceBranch,
  targetBranch,
  origin
) {
  try {
    const res = await ajaxClient.GET(
      `projects/${encodeURIComponent(
        repoURLName
      )}/merge_requests?state=opened&source_branch=${sourceBranch}&target_branch=${targetBranch}`,
      origin,
      csrf_token
    );
    const jsonResponse = await res.json();
    return jsonResponse;
  } catch (e) {
    throw new Error(e.toString());
  }
}

export { getMergeRequestInfo, isOpenMergeRequest };

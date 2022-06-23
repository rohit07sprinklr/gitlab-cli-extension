import { getSearchQueryParams } from "./utils";
const main = () => {
  const createCherryPickCommit = getSearchQueryParams(
    "create_cherrypick_commit"
  );
  if (createCherryPickCommit) {
    const sourceBranchDropdownn = document.querySelector(
      '[name="merge_request[source_branch]"]'
    );
    sourceBranchDropdownn.value = getSearchQueryParams("commit_branch");
    const targetBranchDropdownn = document.querySelector(
      '[name="merge_request[target_branch]"]'
    );
    targetBranchDropdownn.value = getSearchQueryParams("target_branch");
    const submitButton = document.querySelector(
      '[data-qa-selector="compare_branches_button"]'
    );
    submitButton.click();
  }
};
main();

export {};

import { getSearchQueryParams } from "./utils";
const main = () => {
  const searchQuery = window.location.search.slice(1);
  if (searchQuery.startsWith("create_cherrypick_commit")) {
    const searchQueryParams = getSearchQueryParams(searchQuery);
    const sourceBranchDropdownn = document.querySelector(
      '[name="merge_request[source_branch]"]'
    );
    sourceBranchDropdownn.value = searchQueryParams.commit_branch;
    const targetBranchDropdownn = document.querySelector(
      '[name="merge_request[target_branch]"]'
    );
    targetBranchDropdownn.value = searchQueryParams.target_branch;
    const submitButton = document.querySelector(
      '[data-qa-selector="compare_branches_button"]'
    );
    submitButton.click();
  }
};
main();

export {};

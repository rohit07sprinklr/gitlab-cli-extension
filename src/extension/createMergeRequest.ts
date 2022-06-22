import {getSearchQueryParams} from './utils'
const main = () => {
  const searchQuery = window.location.search.split("?")[1];
  if (searchQuery.startsWith("create_cherrypick_commit")) {
    const searchQueryParams = getSearchQueryParams(searchQuery);
    const sourceBranchDropdownn = document.querySelector('[data-field-name="merge_request[source_branch]"]');
    sourceBranchDropdownn.setAttribute('title',searchQueryParams.commit_branch);
    const targetBranchDropdownn = document.querySelector('[data-field-name="merge_request[target_branch]"]');
    sourceBranchDropdownn.setAttribute('title',searchQueryParams.target_branch);
  }
};
main();

export {};

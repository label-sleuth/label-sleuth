/*
    Copyright (c) 2022 IBM Corp.
    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
*/

import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import { InputBase, Paper } from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
import SearchIcon from "@mui/icons-material/Search";
import { forwardRef, useMemo } from "react";
import { useSelector } from "react-redux";
import { panelIds } from "../../../const";
import useSearchElement from "./customHooks/useSearchElement";
import usePanelPagination from "../../../customHooks/usePanelPagination";
import { ElementList } from "./components/commonComponents";
import { CustomPagination } from "../../../components/pagination/CustomPagination";

const SearchInput = ({
  textInputRef,
  input,
  clearSearchInput,
  resetPagination,
}) => {
  const { handleSearchInputEnterKey, handleSearch, handleSearchInputChange } =
    useSearchElement(resetPagination);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        alignItem: "center",
        marginTop: "19px",
        borderBottom: "1px solid #e2e2e2",
        pb: "20px",
        justifyContent: "center",
      }}
    >
      <Paper
        component="form"
        sx={{
          p: "2px 4px",
          display: "flex",
          alignItems: "center",
          width: 320,
          height: 40,
          marginLeft: 1,
        }}
      >
        <InputBase
          sx={{ ml: 1, flex: 1 }}
          placeholder="Search"
          inputProps={{ "aria-label": "search" }}
          onKeyPress={handleSearchInputEnterKey}
          onChange={handleSearchInputChange}
          inputRef={textInputRef}
          defaultValue={input}
          autoFocus={true}
        />
        {input && (
          <>
            <IconButton
              sx={{ p: "1px" }}
              aria-label="search"
              onClick={clearSearchInput}
            >
              <ClearIcon />
            </IconButton>
            {
              <IconButton
                sx={{ p: "1px" }}
                aria-label="search"
                onClick={handleSearch}
              >
                <SearchIcon />
              </IconButton>
            }
          </>
        )}
      </Paper>
    </Box>
  );
};

const SearchPanel = forwardRef(({ clearSearchInput }, textInputRef) => {
  const { input, lastSearchString, hitCount, uniqueHitCount } = useSelector(
    (state) => state.workspace.panels[panelIds.SEARCH]
  );

  const sidebarPanelElementsPerPage = useSelector(
    (state) => state.featureFlags.sidebarPanelElementsPerPage
  );

  const loading = useSelector(
    (state) => state.workspace.panels.loading[panelIds.SEARCH]
  );

  const {
    currentContentData,
    currentPage,
    resetPagination,
    onPageChange,
    isPaginationRequired,
   } = usePanelPagination({
    elementsPerPage: sidebarPanelElementsPerPage,
    panelId: panelIds.SEARCH,
    shouldFetch: input !== null && input !== "",
    fetchOnFirstRender: false,
  });

  const emptyResults = useMemo(
    () => currentContentData && currentContentData.length === 0,
    [currentContentData]
  );

  const nonEmptyResults = useMemo(
    () => currentContentData && currentContentData.length > 0,
    [currentContentData]
  );

  const noSearchDone = useMemo(
    () => !emptyResults && !nonEmptyResults,
    [nonEmptyResults, emptyResults]
  );

  return (
    <Box>
      <SearchInput
        textInputRef={textInputRef}
        input={input}
        clearSearchInput={clearSearchInput}
        resetPagination={resetPagination}
      />
      <ElementList
        elements={currentContentData}
        loading={loading}
        nonEmptyResultsMessage={`Showing ${sidebarPanelElementsPerPage} of ${uniqueHitCount} found elements ${
          uniqueHitCount !== hitCount
            ? `(${hitCount} including duplicates)`
            : ""
        }`}
        emptyResultsMessage={"No matching results were found."}
        isPaginationRequired={isPaginationRequired}
      />
      <CustomPagination
        currentContentData={currentContentData}
        hitCount={uniqueHitCount}
        sidebarPanelElementsPerPage={sidebarPanelElementsPerPage}
        currentPage={currentPage}
        onPageChange={onPageChange}
        isPaginationRequired={isPaginationRequired}
      />
    </Box>
  );
});

export default SearchPanel;

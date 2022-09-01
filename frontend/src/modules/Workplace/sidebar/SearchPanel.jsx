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
import { InputBase, Paper, Typography } from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
import SearchIcon from "@mui/icons-material/Search";
import classes from "./index.module.css";
import Element from "./Element";
import { forwardRef } from "react";
import { useSelector } from "react-redux";
import { panelIds } from "../../../const";
import useSearchElement from "./customHooks/useSearchElement";

const SearchPanel = forwardRef(({clearSearchInput}, textInputRef) => {

  const { handleSearchInputEnterKey, handleSearch, handleSearchInputChange } =
    useSearchElement();

  const { elements, input, hitCount, uniqueHitCount } = useSelector(
    (state) => state.workspace.panels[panelIds.SEARCH]
  );

  return (
    <Box>
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
      {elements && Object.keys(elements).length > 0 && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            mt: 1,
            fontSize: "0.8rem",
            color: "rgba(0,0,0,.54)",
          }}
        >
          <Typography
            sx={{
              display: "flex",
              justifyContent: "center",
              fontSize: "0.8rem",
              color: "rgba(0,0,0,.54)",
            }}
          >
            {`${uniqueHitCount} elements found (${hitCount} including duplicates)`}
          </Typography>
        </Box>
      )}
      <Box className={classes["search-results"]} sx={{ mt: 2 }}>
        {elements &&
          (Object.values(elements).length === 0 ? (
            <Box>
              <Typography
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  fontSize: "0.9rem",
                  color: "rgba(0,0,0,.54)",
                }}
              >
                No matching results were found.
              </Typography>
            </Box>
          ) : (
            <Box>
              {Object.values(elements).map((element, i) => {
                return <Element element={element} key={element.id} />;
              })}
            </Box>
          ))}
      </Box>
    </Box>
  );
});

export default SearchPanel;

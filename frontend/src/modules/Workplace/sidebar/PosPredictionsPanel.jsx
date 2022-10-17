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

import { Box, Typography } from "@mui/material";
import React from "react";
import classes from "./index.module.css";
import { useSelector } from "react-redux";
import Element from "./Element";
import { curCategoryNameSelector } from "../redux/DataSlice";
import { panelIds } from "../../../const";
import { ElementList, Header } from "./components/commonComponents";
import usePanelPagination from "../../../customHooks/usePanelPagination";
import { CustomPagination } from "../../../components/pagination/CustomPagination";

const PosPredictionsPanel = () => {
  const curCategoryName = useSelector(curCategoryNameSelector);

  const { hitCount } = useSelector(
    (state) => state.workspace.panels[panelIds.POSITIVE_PREDICTIONS]
  );

  const loading = useSelector(
    (state) => state.workspace.panels.loading[panelIds.POSITIVE_PREDICTIONS]
  );

  const sidebarPanelElementsPerPage = useSelector(
    (state) => state.featureFlags.sidebarPanelElementsPerPage
  );

  const {
    currentContentData,
    currentPage,
    onPageChange,
    isPaginationRequired,
  } = usePanelPagination({
    elementsPerPage: sidebarPanelElementsPerPage,
    panelId: panelIds.POSITIVE_PREDICTIONS,
  });

  return (
    <Box>
      <Header message={"Positive predictions"} />
      <ElementList
        elements={currentContentData}
        loading={loading}
        nonEmptyResultsMessage={`The following examples are predicted by the system to be related to the category '${curCategoryName}'`}
        emptyResultsMessage={""}
        isPaginationRequired={isPaginationRequired}
        elementsTopPadding={2}
      />
      <CustomPagination
        currentContentData={currentContentData}
        hitCount={hitCount}
        sidebarPanelElementsPerPage={sidebarPanelElementsPerPage}
        currentPage={currentPage}
        onPageChange={onPageChange}
        isPaginationRequired={isPaginationRequired}
      />
    </Box>
  );
};

export default PosPredictionsPanel;

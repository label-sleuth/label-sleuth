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

import { Box } from "@mui/material";
import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import { curCategoryNameSelector } from "../redux";
import { panelIds } from "../../../const";
import { ElementList, Header } from "./components/commonComponents";
import usePanelPagination from "../../../customHooks/usePanelPagination";
import { ArrowsOnlyPagination } from "../../../components/pagination/ArrowsOnlyPagination";

const PosPredictionsPanel = () => {
  const curCategoryName = useSelector(curCategoryNameSelector);

  const { hitCount } = useSelector((state) => state.workspace.panels.panels[panelIds.POSITIVE_PREDICTIONS]);

  const loading = useSelector((state) => state.workspace.panels.loading[panelIds.POSITIVE_PREDICTIONS]);

  const sidebarPanelElementsPerPage = useSelector((state) => state.featureFlags.sidebarPanelElementsPerPage);

  const { currentContentData, currentPage, isPaginationRequired, previousPage, nextPage, pageCount } =
    usePanelPagination({
      elementsPerPage: sidebarPanelElementsPerPage,
      panelId: panelIds.POSITIVE_PREDICTIONS,
      modelAvailableRequired: true,
    });

  const nonEmptyResultsMessage = useMemo(() => {
    const startingMessage = `The following examples are predicted by the system to belong to the category '${curCategoryName}'.`;
    const firstElementIndex = sidebarPanelElementsPerPage * (currentPage - 1);
    const finalMessage = ` Displaying predictions ${firstElementIndex + 1} to ${
      currentPage === pageCount ? hitCount : firstElementIndex + sidebarPanelElementsPerPage
    } out of ${hitCount}.`;
    return startingMessage + finalMessage;
  }, [curCategoryName, hitCount, sidebarPanelElementsPerPage, currentPage, pageCount]);

  return (
    <Box>
      <Header message={"Positive predictions"} />
      <ElementList
        elements={currentContentData}
        loading={loading}
        nonEmptyResultsMessage={nonEmptyResultsMessage}
        emptyResultsMessage={""}
        isPaginationRequired={isPaginationRequired}
        elementsTopPadding={2}
      />
      <ArrowsOnlyPagination
        currentContentData={currentContentData}
        hitCount={hitCount}
        sidebarPanelElementsPerPage={sidebarPanelElementsPerPage}
        currentPage={currentPage}
        isPaginationRequired={isPaginationRequired}
        previousPage={previousPage}
        nextPage={nextPage}
      />
    </Box>
  );
};

export default PosPredictionsPanel;

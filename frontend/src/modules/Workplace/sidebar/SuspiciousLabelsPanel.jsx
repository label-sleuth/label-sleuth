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
import React from "react";
import { useSelector } from "react-redux";
import { panelIds } from "../../../const";
import { ElementList, Header } from "./components/commonComponents";
import usePanelPagination from "../../../customHooks/usePanelPagination";
import { CustomPagination } from "../../../components/pagination/CustomPagination";

const SuspiciousLabelsPanel = () => {
  const { hitCount } = useSelector(
    (state) => state.workspace.panels.panels[panelIds.SUSPICIOUS_LABELS]
  );

  const loading = useSelector(
    (state) => state.workspace.panels.loading[panelIds.SUSPICIOUS_LABELS]
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
    panelId: panelIds.SUSPICIOUS_LABELS,
    modelAvailableRequired: true,
  });

  return (
    <Box>
      <Header message={"Suspicious labels"} />
      <ElementList
        elements={currentContentData}
        loading={loading}
        nonEmptyResultsMessage={
          "Review the labels of these examples which the system suspects might be wrong"
        }
        emptyResultsMessage={"No suspicious labels were found."}
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

export default SuspiciousLabelsPanel;

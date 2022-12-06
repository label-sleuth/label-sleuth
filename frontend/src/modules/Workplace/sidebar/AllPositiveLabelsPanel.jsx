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
import { useDispatch, useSelector } from "react-redux";
import { panelIds } from "../../../const";
import { ElementList, Header } from "./components/commonComponents";
import usePanelPagination from "../../../customHooks/usePanelPagination";
import { CustomPagination } from "../../../components/pagination/CustomPagination";
import { useFetchPanelElements } from "../../../customHooks/useFetchPanelElements";
import { setRefetch } from "../redux";

const AllPositiveLabelsPanel = () => {
  const { hitCount } = useSelector(
    (state) => state.workspace.panels[panelIds.POSITIVE_LABELS]
  );

  const refetch = useSelector(
    (state) => state.workspace.panels.refetch
  )

  const loading = useSelector(
    (state) => state.workspace.panels.loading[panelIds.POSITIVE_LABELS]
  );

  const sidebarPanelElementsPerPage = useSelector(
    (state) => state.featureFlags.sidebarPanelElementsPerPage
  );

  const dispatch = useDispatch()

  const {
    currentContentData,
    currentPage,
    onPageChange,
    isPaginationRequired,
  } = usePanelPagination({
    elementsPerPage: sidebarPanelElementsPerPage,
    panelId: panelIds.POSITIVE_LABELS,
    modelAvailableRequired: false,
  });

  const fetchPositiveLabelsElements = useFetchPanelElements({panelId: panelIds.POSITIVE_LABELS})

  React.useEffect(() => {
    if (refetch) {
      fetchPositiveLabelsElements()
      dispatch(setRefetch(false))
    }
  }, [fetchPositiveLabelsElements, refetch, dispatch])
  

  return (
    <Box>
      <Header message={"Positive labels"} />
      <ElementList
        elements={currentContentData}
        loading={loading}
        nonEmptyResultsMessage={
          "These are all the examples labeled by you as positive"
        }
        emptyResultsMessage={"You didn't label any elements as positive so far"}
        isPaginationRequired={isPaginationRequired}
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

export default AllPositiveLabelsPanel;

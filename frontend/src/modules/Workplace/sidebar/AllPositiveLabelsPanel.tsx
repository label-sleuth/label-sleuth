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
import { useAppSelector } from "../../../customHooks/useRedux";
import { PanelIdsEnum } from "../../../const";
import { ElementList, Header } from "./components/commonComponents";
import usePanelPagination from "../../../customHooks/usePanelPagination";
import { CustomPagination } from "../../../components/pagination/CustomPagination";
import { Element } from "../../../global";

const AllPositiveLabelsPanel = () => {
  const { hitCount } = useAppSelector((state) => state.workspace.panels.panels[PanelIdsEnum.POSITIVE_LABELS]);
  const curCategory = useAppSelector((state) => state.workspace.curCategory);

  const loading = useAppSelector((state) => state.workspace.panels.loading[PanelIdsEnum.POSITIVE_LABELS]);

  const sidebarPanelElementsPerPage = useAppSelector((state) => state.featureFlags.sidebarPanelElementsPerPage);

  const { currentContentData, currentPage, onPageChange, isPaginationRequired } = usePanelPagination({
    elementsPerPage: sidebarPanelElementsPerPage,
    panelId: PanelIdsEnum.POSITIVE_LABELS,
    modelAvailableRequired: false,
    otherDependencies: [curCategory],
  });

  return (
    <Box>
      <Header message={"Positive labels"} />
      <ElementList
        elements={currentContentData as Element[]}
        loading={loading}
        nonEmptyResultsMessage={"These are all the examples labeled by you as positive"}
        emptyResultsMessage={"You didn't label any elements as positive so far"}
        isPaginationRequired={isPaginationRequired}
      />
      <CustomPagination
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

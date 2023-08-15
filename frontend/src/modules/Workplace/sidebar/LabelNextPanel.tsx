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

const LabelNextPanel = () => {
  const { hitCount } = useAppSelector(
    (state) => state.workspace.panels.panels[PanelIdsEnum.LABEL_NEXT]
  );

  const loading = useAppSelector(
    (state) => state.workspace.panels.loading[PanelIdsEnum.LABEL_NEXT]
  );

  const sidebarPanelElementsPerPage = useAppSelector(
    (state) => state.featureFlags.sidebarPanelElementsPerPage
  );

  const modelVersion = useAppSelector((state) => state.workspace.modelVersion);

  const {
    currentContentData,
    currentPage,
    onPageChange,
    isPaginationRequired,
  } = usePanelPagination({
    elementsPerPage: sidebarPanelElementsPerPage,
    panelId: PanelIdsEnum.LABEL_NEXT,
    modelAvailableRequired: true,
    // update elements when model version changes and is not because it is null
    otherDependencies: [modelVersion],
    shouldFetch: modelVersion !== null,
  });

  return (
    <Box>
      <Header message={"Label next"} />
      <ElementList
        elements={currentContentData as Element[]}
        loading={loading}
        nonEmptyResultsMessage={"Labeling these elements next will be most effective at improving the model. The suggested elements do not reflect the model performance. To evaluate the model go to the evaluation panel."}
        emptyResultsMessage={""}
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

export default LabelNextPanel;

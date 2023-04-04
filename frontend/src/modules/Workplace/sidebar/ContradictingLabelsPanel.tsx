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

import { Box, Stack, Divider } from "@mui/material";
import React from "react";
import classes from "./index.module.css";
import { useAppSelector } from "../../../customHooks/useRedux";
import { SidebarElement as ElementComponent } from "../../../components/element/SidebarElement";
import contradictive_elem_icon from "../../../assets/contradicting.svg";
import { panelIds, PanelIdsEnum } from "../../../const";
import { ElementList, Header } from "./components/commonComponents";
import usePanelPagination from "../../../customHooks/usePanelPagination";
import { CustomPagination } from "../../../components/pagination/CustomPagination";
import { Element } from "../../../global";

interface PairListProps {
  pairs: string[][];
}

interface ContradictingPairProps {
  addSeparator: boolean;
  children: React.ReactNode[];
}

const ContradictingLabelsPanel = () => {
  const sidebarPanelElementsPerPage = useAppSelector((state) => state.featureFlags.sidebarPanelElementsPerPage);
  const { elements, pairs, hitCount } = useAppSelector(
    (state) => state.workspace.panels.panels[PanelIdsEnum.CONTRADICTING_LABELS]
  );
  const loading = useAppSelector((state) => state.workspace.panels.loading[panelIds.CONTRADICTING_LABELS]);
  const curCategory = useAppSelector((state) => state.workspace.curCategory);

  const { currentContentData, currentPage, onPageChange, isPaginationRequired } = usePanelPagination({
    elementsPerPage: sidebarPanelElementsPerPage,
    panelId: PanelIdsEnum.CONTRADICTING_LABELS,
    modelAvailableRequired: false,
    otherDependencies: [curCategory],
  });

  const Separator = () => (
    <Divider variant="middle" flexItem>
      <Stack direction={"row"} sx={{ mt: "40px", mb: "40px" }}>
        <div className={classes["dot-separator"]} style={{ marginRight: "6px" }} />
        <div className={classes["dot-separator"]} style={{ marginRight: "6px" }} />
        <div className={classes["dot-separator"]} />
      </Stack>
    </Divider>
  );

  const ContradictingPair = ({ addSeparator, children }: ContradictingPairProps) => {
    const childrenArray = React.Children.toArray(children);
    return (
      <Stack direction={"column"} sx={{ alignItems: "center" }}>
        {childrenArray[0]}
        <Box sx={{ display: "flex", flexDirection: "row" }}>
          <img src={contradictive_elem_icon} alt={"contradictive element"} style={{ paddingRight: "5px" }} />
          {"?"}
        </Box>
        {childrenArray[1]}
        {addSeparator ? <Separator /> : null}
      </Stack>
    );
  };

  const PairList = ({ pairs }: PairListProps) => {
    return (
      <Box>
        {pairs &&
          pairs.map((pair, i) => (
            <ContradictingPair key={i} addSeparator={i !== pairs.length - 1}>
              {pair.map((elementId, j) => {
                if (elements === null) return null;
                const element = elements[elementId];
                return <ElementComponent key={2 * i + j} index={2 * i + j} element={element} />;
              })}
            </ContradictingPair>
          ))}
      </Box>
    );
  };

  return (
    <Box>
      <Header message={"Contradicting labels"} />
      <ElementList
        elements={currentContentData as Element[]}
        loading={loading}
        nonEmptyResultsMessage={`Review these ${pairs.length} pairs of examples, which are semantically similar but were labeled by you with contradicting labels`}
        emptyResultsMessage={"No contradicting pairs of examples were found."}
        isPaginationRequired={isPaginationRequired}
        elementsTopPadding={4}
      >
        <PairList pairs={pairs} />
      </ElementList>
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

export default ContradictingLabelsPanel;

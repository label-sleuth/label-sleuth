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

import { styled } from "@mui/material/styles";
import Box from "@mui/material/Box";
import { MainElement } from "../../../components/element/MainElement";
import { useAppSelector } from "../../../customHooks/useRedux";
import "../../../components/pagination/pagination.css";
import classes from "./MainPanel.module.css";
import left_icon from "../../../assets/workspace/doc_left.svg";
import right_icon from "../../../assets/workspace/doc_right.svg";
import Tooltip from "@mui/material/Tooltip";
import {
  PREV_DOC_TOOLTIP_MSG,
  NEXT_DOC_TOOLTIP_MSG,
  LEFT_DRAWER_WIDTH,
  ACTIONS_DRAWER_WIDTH,
  APPBAR_HEIGHT,
  PanelIdsEnum,
} from "../../../const";
import {
  getPanelDOMKey,
  getDocumentNameFromDocumentId,
} from "../../../utils/utils";
import { useScrollMainPanelElementIntoView } from "../../../customHooks/useScrollElementIntoView";
import { CustomPagination } from "../../../components/pagination/CustomPagination";
import { useFetchPrevNextDoc } from "../../../customHooks/useFetchPrevNextDoc";
import { useMainPagination } from "../../../customHooks/useMainPagination";
import { Element } from "../../../global";
import { currentDocNameSelector } from "../redux/documentSlice";
import { NavigatePositivePredictions } from "./NavigatePositivePredictions";
import { Stack } from "@mui/material";

const Main = styled(Box, { shouldForwardProp: (prop) => prop !== "open" })(
  ({
    theme,
    open,
    rightDrawerWidth,
  }: {
    theme?: any;
    open: boolean;
    rightDrawerWidth: number;
  }) => ({
    position: "fixed",
    margin: 0,
    right: ACTIONS_DRAWER_WIDTH,
    left: LEFT_DRAWER_WIDTH,
    top: APPBAR_HEIGHT,
    bottom: 0,
    overflow: "none",
    display: "flex",
    flexDirection: "column",
    ...(open && {
      marginRight: rightDrawerWidth,
    }),
  })
);

interface MainPanelProps {
  open: boolean;
  rightDrawerWidth: number;
}

const MainPanel = ({ open, rightDrawerWidth }: MainPanelProps) => {
  const documents = useAppSelector((state) => state.workspace.documents);
  const mainPanelElementsPerPage = useAppSelector(
    (state) => state.featureFlags.mainPanelElementsPerPage
  );
  const curDocIndex = useAppSelector((state) => state.workspace.curDocIndex);
  const curDocName = useAppSelector(currentDocNameSelector);

  const documentPositivePredictionIds = useAppSelector(
    (state) =>
      state.workspace.panels.panels[PanelIdsEnum.MAIN_PANEL]
        .documentPositivePredictionIds
  );

  const {
    currentContentData,
    hitCount,
    currentPage,
    onPageChange,
    isPaginationRequired,
  } = useMainPagination(mainPanelElementsPerPage);

  const { handleFetchNextDoc, handleFetchPrevDoc } = useFetchPrevNextDoc();

  useScrollMainPanelElementIntoView();

  return (
    <>
      <Main
        className={`${classes.main_content} `}
        open={open}
        rightDrawerWidth={rightDrawerWidth}
      >
        <Box className={classes.doc_header} sx={{ pb: 1.2, pt: 1 }}>
          <Tooltip
            title={curDocIndex !== 0 ? PREV_DOC_TOOLTIP_MSG : ""}
            placement="right"
            componentsProps={{
              tooltip: {
                sx: {
                  bgcolor: curDocIndex !== 0 ? "common.black" : "transparent",
                },
              },
            }}
          >
            <button
              className={
                curDocIndex === 0
                  ? classes["doc_button_disabled"]
                  : classes["doc_button"]
              }
              onClick={handleFetchPrevDoc}
            >
              <img src={left_icon} alt={"previous document"} />
            </button>
          </Tooltip>
          <Box className={classes.doc_stats}>
            <h6>{getDocumentNameFromDocumentId(curDocName)}</h6>
            <Stack
              direction={"row"}
              alignItems={"center"}
              justifyContent={"center"}
              sx={{ mt: 0 }}
            >
              <em style={{ fontSize: "0.80em" }}>
                Text elements: {hitCount ?? 0}
              </em>

              {documentPositivePredictionIds !== null ? (
                <>
                  <h6
                    style={{
                      opacity: 0.5,
                      fontSize: "1rem",
                      marginLeft: "10px",
                      marginRight: "5px",
                    }}
                  >
                    |
                  </h6>
                  <NavigatePositivePredictions />
                </>
              ) : null}
            </Stack>
          </Box>
          <Tooltip
            title={
              documents.length - 1 !== curDocIndex ? NEXT_DOC_TOOLTIP_MSG : ""
            }
            placement="left"
            componentsProps={{
              tooltip: {
                sx: {
                  bgcolor:
                    documents.length - 1 !== curDocIndex
                      ? "common.black"
                      : "transparent",
                },
              },
            }}
          >
            <button
              className={
                documents.length - 1 === curDocIndex
                  ? classes["doc_button_disabled"]
                  : classes["doc_button"]
              }
              onClick={handleFetchNextDoc}
            >
              <img src={right_icon} alt={"next document"} />
            </button>
          </Tooltip>
        </Box>
        <Box
          id="main-element-view"
          sx={(theme) => ({
            paddingLeft: theme.spacing(3),
            paddingRight: theme.spacing(3),
            paddingTop: theme.spacing(3),
            overflow: "auto",
          })}
        >
          {currentContentData &&
            currentContentData.map((element) => (
              <MainElement
                element={element as Element}
                key={getPanelDOMKey(
                  (element as Element).id,
                  PanelIdsEnum.MAIN_PANEL
                )}
              />
            ))}
        </Box>
        <CustomPagination
          hitCount={hitCount}
          sidebarPanelElementsPerPage={mainPanelElementsPerPage}
          currentPage={currentPage}
          onPageChange={onPageChange}
          size="medium"
          isPaginationRequired={isPaginationRequired}
        />
      </Main>
    </>
  );
};

export default MainPanel;

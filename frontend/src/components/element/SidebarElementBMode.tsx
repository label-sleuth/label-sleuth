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

import Highlighter from "react-highlight-words";
import classes from "./SidebarElement.module.css";
import labelButtonClasses from "../labelButtons/index.module.css";
import { Box, Stack, Typography } from "@mui/material";
import { useAppSelector, useAppDispatch } from "../../customHooks/useRedux";
import { PanelIdsEnum, LabelTypesEnum } from "../../const";
import {
  getDocumentNameFromDocumentId,
  getPanelDOMKey,
} from "../../utils/utils";
import React, {
  useMemo,
  useCallback,
  useState,
  useEffect,
  useRef,
} from "react";
import { setfocusedSidebarElementByIndex } from "../../modules/Workplace/redux";
import { useFocusMainPanelElement } from "../../customHooks/useFocusMainPanelElement";
import useLabelState from "../../customHooks/useLabelState";
import { LabelingButtons } from "./LabelingButtons";
import { TooltipTitleWithShortcut } from "./TooltipTitleWithShortcut";
import { Keyboard } from "../Keyboard";
import { LabelCategoriesMenu } from "./LabelNonCurrentCatMenu";
import { PosPredIndicator } from "./MainElement";
import { SidebarElementProps } from "./SidebarElement";

const text_colors = {
  [LabelTypesEnum.POS]: { color: "#3092ab" },
  [LabelTypesEnum.NEG]: { color: "#bd3951" },
  [LabelTypesEnum.NONE]: {},
};

/**
 * Handle the style of the text of the sidebar element based on the models prediction
 * @param {*} modelPrediction
 * @returns
 */
// this function is not returned by a custom hook as it is the case of the main panel equivalent
const handleTextElemStyle = (modelPrediction: LabelTypesEnum) =>
  modelPrediction === "pos" ? classes["text_predict"] : classes["text_normal"];

export const SidebarElementBMode = ({
  element,
  updateCounterOnLabeling = true,
  index,
}: SidebarElementProps) => {
  const { id, docId, text, userLabel, modelPrediction, snippet } = element;

  const dispatch = useAppDispatch();
  const rightToLeft = useAppSelector((state) => state.featureFlags.rightToLeft);
  const curCategory = useAppSelector((state) => state.workspace.curCategory);

  const activePanelId = useAppSelector(
    (state) => state.workspace.panels.activePanelId
  );
  const searchInput = useAppSelector(
    (state) => state.workspace.panels.panels[PanelIdsEnum.SEARCH].input
  );
  const { index: focusedSidebarElementIndex } = useAppSelector(
    (state) => state.workspace.panels.focusedSidebarElement
  );

  const [maxTextWidth, setMaxTextWidth] = useState(0);
  const elementRef = useRef<HTMLElement | null>(null);

  // used to get the height of the element to position the pos pred icon in the middle
  // eslint-disable-next-line
  useEffect(() => {
    if (elementRef.current) {
      const parentWidth = elementRef.current.parentElement?.clientWidth || 0;
      setMaxTextWidth(parentWidth - 104 - 30);
    }
  });

  const isElementFocused = useMemo(
    () => index === focusedSidebarElementIndex,
    [index, focusedSidebarElementIndex]
  );

  const elementDOMkey = useMemo(
    () => getPanelDOMKey(id, activePanelId, index),
    [id, activePanelId, index]
  );

  const { handlePosLabelAction, handleNegLabelAction } = useLabelState(
    updateCounterOnLabeling
  );

  const { focusMainPanelElement } = useFocusMainPanelElement();

  const [labelMenuOpenAnchorEl, setLabelMenuOpenAnchorEl] = React.useState<
    (EventTarget & globalThis.Element) | null
  >(null);

  const labelMenuOpen = useMemo(
    () => Boolean(labelMenuOpenAnchorEl),
    [labelMenuOpenAnchorEl]
  );

  const handleElementClick = useCallback(
    (e) => {
      dispatch(
        setfocusedSidebarElementByIndex({
          index,
          scrollIntoViewOnChange: false,
        })
      );
      focusMainPanelElement({ element, docId });
      // focus this element on the sidebar when clicked
    },
    [element, docId, focusMainPanelElement, index, dispatch]
  );

  return (
    <>
      <Box
        onClick={handleElementClick}
        className={`${handleTextElemStyle(modelPrediction)} ${
          isElementFocused ? classes["focused_element"] : ""
        } ${labelButtonClasses.text_element} ${
          !isElementFocused && labelMenuOpen
            ? classes.hover_element_on_menu_open
            : ""
        }`}
        sx={{
          padding: "0 !important",
          mb: 2,
          ml: modelPrediction === LabelTypesEnum.POS ? "17px" : "13px",
          mr: 0,
          alignSelf: "stretch",
          backgroundColor: "white",
          boxShadow:
            modelPrediction === LabelTypesEnum.POS
              ? "-7px 0px 4px #a3d8e5 !important;"
              : "none",
        }}
        style={{ cursor: "pointer" }}
        id={elementDOMkey}
        ref={elementRef}
      >
        {modelPrediction === LabelTypesEnum.POS ? (
          <Box
            sx={{
              position: "absolute",
              left: "-15px",
              top: "14px",
            }}
          >
            <PosPredIndicator />
          </Box>
        ) : null}
        <Box>
          <p
            id={id}
            className={`${classes["elem_text"]} ${
              rightToLeft ? classes.right_to_left : ""
            }`}
            style={{
              ...text_colors[userLabel],
              padding: `1px 10px 0px ${
                modelPrediction === LabelTypesEnum.POS ? "13px" : "17px"
              }`,
            }}
          >
            <Highlighter
              searchWords={
                activePanelId === PanelIdsEnum.SEARCH ? [searchInput || ""] : []
              }
              autoEscape={true}
              textToHighlight={snippet || text}
            />
          </p>
        </Box>
        <Stack direction={"row"} justifyContent={"space-between"}>
          <Typography
            variant={"caption"}
            sx={{
              color: "gray",
              paddingLeft:
                modelPrediction === LabelTypesEnum.POS ? "13px" : "17px",
              fontStyle: "italic",
              marginTop: 0.5,
              maxWidth: maxTextWidth,
              textOverflow: "ellipsis",
              overflow: "hidden",
              whiteSpace: "nowrap",
            }}
            className={rightToLeft ? classes.right_to_left : ""}
          >
            {`From document "${getDocumentNameFromDocumentId(docId)}"`}
          </Typography>
          {curCategory !== null ? (
            <LabelingButtons
              isElementFocused={isElementFocused}
              labelMenuOpen={labelMenuOpen}
              labelMenuOpenAnchorEl={labelMenuOpenAnchorEl}
              setLabelMenuOpenAnchorEl={setLabelMenuOpenAnchorEl}
              element={element}
              handlePosLabelAction={handlePosLabelAction}
              handleNegLabelAction={handleNegLabelAction}
              panelId={activePanelId}
              sx={{
                justifyContent: "flex-end",
                marginBottom: 0,
                height: "25px",
                mr: 1,
                mb: 1,
              }}
              negTooltipProps={{
                arrow: true,
                title: (
                  <TooltipTitleWithShortcut
                    title={"Negative label"}
                    icon={<Keyboard kbd={"←"} />}
                  />
                ),
                enterDelay: 500,
              }}
              posTooltipProps={{
                arrow: true,
                title: (
                  <TooltipTitleWithShortcut
                    title={"Positive label"}
                    icon={<Keyboard kbd={"→"} />}
                  />
                ),
                enterDelay: 500,
              }}
              otherCatsTooltipProps={{
                arrow: true,
                enterDelay: 500,
              }}
            />
          ) : null}
        </Stack>
      </Box>
      <LabelCategoriesMenu
        anchorEl={labelMenuOpenAnchorEl}
        open={labelMenuOpen}
        setLabelMenuOpenAnchorEl={setLabelMenuOpenAnchorEl}
        element={element}
        panelId={activePanelId}
      />
    </>
  );
};

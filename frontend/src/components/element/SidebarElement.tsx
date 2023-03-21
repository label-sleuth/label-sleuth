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
import Paper from "@mui/material/Paper";
import classes from "./index.module.css";
import labelButtonClasses from "../labelButtons/index.module.css";
import { Box } from "@mui/material";
import { useAppSelector, useAppDispatch } from "../../customHooks/useRedux";
import { PanelIdsEnum, LabelTypesEnum } from "../../const";
import { getDocumentNameFromDocumentId, getPanelDOMKey } from "../../utils/utils";
import React, { useMemo, useCallback } from "react";
import { setfocusedSidebarElementByIndex } from "../../modules/Workplace/redux";
import { useFocusMainPanelElement } from "../../customHooks/useFocusMainPanelElement";
import useLabelState from "../../customHooks/useLabelState";
import { Element } from "../../global";
import { LabelingButtons } from "./LabelingButtons";
import { TooltipTitleWithShortcut } from "./TooltipTitleWithShortcut";
import { Keyboard } from "../Keyboard";
import { LabelCategoriesMenu } from "./LabelNonCurrentCatMenu";

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

interface SidebarElementProps {
  element: Element;
  updateCounterOnLabeling?: boolean;
  index: number;
}

export const SidebarElement = ({ element, updateCounterOnLabeling = true, index }: SidebarElementProps) => {
  const dispatch = useAppDispatch();
  const { id, docId, text, userLabel, modelPrediction } = element;
  const activePanelId = useAppSelector((state) => state.workspace.panels.activePanelId);
  const searchInput = useAppSelector((state) => state.workspace.panels.panels[PanelIdsEnum.SEARCH].input);
  const { index: focusedSidebarElementIndex } = useAppSelector((state) => state.workspace.panels.focusedSidebarElement);
  const curCategory = useAppSelector((state) => state.workspace.curCategory);

  const rightToLeft = useAppSelector((state) => state.featureFlags.rightToLeft);

  const isElementFocused = useMemo(() => index === focusedSidebarElementIndex, [index, focusedSidebarElementIndex]);

  const elementDOMkey = useMemo(() => getPanelDOMKey(id, activePanelId, index), [id, activePanelId, index]);
  const { handlePosLabelAction, handleNegLabelAction } = useLabelState(updateCounterOnLabeling);

  const { focusMainPanelElement } = useFocusMainPanelElement();

  const [labelMenuOpenAnchorEl, setLabelMenuOpenAnchorEl] = React.useState<(EventTarget & globalThis.Element) | null>(
    null
  );
  const labelMenuOpen = useMemo(() => Boolean(labelMenuOpenAnchorEl), [labelMenuOpenAnchorEl]);

  const handleElementClick = useCallback(
    (e) => {
      dispatch(setfocusedSidebarElementByIndex({ index, scrollIntoViewOnChange: false }));
      focusMainPanelElement({ element, docId });
      // focus this element on the sidebar when clicked
    },
    [element, docId, focusMainPanelElement, index, dispatch]
  );

  return (
    <>
      <Paper
        onClick={handleElementClick}
        className={`${handleTextElemStyle(modelPrediction)} ${isElementFocused ? classes["focused_element"] : ""} ${
          labelButtonClasses.text_element
        } ${!isElementFocused && labelMenuOpen ? classes.hover_element_on_menu_open : ""}`}
        sx={{ padding: "0 !important", mb: 2, ml: 1, mr: 0, alignSelf: "stretch" }}
        style={{ cursor: "pointer" }}
        id={elementDOMkey}
      >
        <label
          style={{ cursor: "pointer" }}
          className={`${modelPrediction === "pos" ? classes["pred_rec_doc_id"] : classes["rec_doc_id"]} ${
            rightToLeft ? classes.right_to_left : ""
          }`}
        >
          {getDocumentNameFromDocumentId(docId)}
        </label>
        <Box>
          <p
            id={id}
            className={`${classes["elem_text"]} ${rightToLeft ? classes.right_to_left : ""}`}
            style={text_colors[userLabel]}
          >
            <Highlighter
              searchWords={activePanelId === PanelIdsEnum.SEARCH ? [searchInput || ""] : []}
              autoEscape={true}
              textToHighlight={text}
            />
          </p>
        </Box>
        {curCategory !== null ? (
          <LabelingButtons
            isElementFocused={isElementFocused}
            labelMenuOpen={labelMenuOpen}
            labelMenuOpenAnchorEl={labelMenuOpenAnchorEl}
            setLabelMenuOpenAnchorEl={setLabelMenuOpenAnchorEl}
            element={element}
            handlePosLabelAction={handlePosLabelAction}
            handleNegLabelAction={handleNegLabelAction}
            sx={{
              justifyContent: "flex-end",
              marginBottom: 0,
              height: "25px",
              mr: 1,
              mb: 1,
            }}
            negTooltipProps={{
              arrow: true,
              title: <TooltipTitleWithShortcut title={"Negative label"} icon={<Keyboard kbd={"←"} />} />,
              enterDelay: 500,
            }}
            posTooltipProps={{
              arrow: true,
              title: <TooltipTitleWithShortcut title={"Positive label"} icon={<Keyboard kbd={"→"} />} />,
              enterDelay: 500,
            }}
            otherCatsTooltipProps={{
              arrow: true,
              enterDelay: 500,
            }}
          />
        ) : null}
      </Paper>
      <LabelCategoriesMenu
        anchorEl={labelMenuOpenAnchorEl}
        open={labelMenuOpen}
        setLabelMenuOpenAnchorEl={setLabelMenuOpenAnchorEl}
        element={element}
      />
    </>
  );
};

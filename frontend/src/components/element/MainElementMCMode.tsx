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

import React, { useMemo } from "react";
import { useAppSelector } from "../../customHooks/useRedux";
import classes from "./Element.module.css";
import labelButtonClasses from "../labelButtons/index.module.css";
import {
  getCategoryColorFromId,
  getCategoryNameFromId,
  getPanelDOMKey,
} from "../../utils/utils";
import { LabelTypesEnum, PanelIdsEnum } from "../../const";
import useLabelState from "../../customHooks/useLabelState";
import { useElemStyles } from "../../customHooks/useElemStyles";
import { LabelingButtons } from "./LabelingButtons";
import { LabelCategoriesMenu } from "./LabelCategoryMCMode";
import { Stack, Typography } from "@mui/material";
import { CategoryBadge } from "../categoryBadge/CategoryBadge";
import { ElementProps } from "./MainElement";

export const MainElementMCMode = ({ element }: ElementProps) => {
  const { id, text, multiclassUserLabel, snippet, multiclassModelPrediction } =
    element;
  const rightToLeft = useAppSelector((state) => state.featureFlags.rightToLeft);
  const categories = useAppSelector((state) => state.workspace.categories);
  const { handlePosLabelAction, handleNegLabelAction } = useLabelState();

  const elementDOMId = useMemo(
    () => getPanelDOMKey(id, PanelIdsEnum.MAIN_PANEL),
    [id]
  );

  const labeledCategoryName = useMemo(() => {
    if (multiclassUserLabel !== null) {
      return getCategoryNameFromId(+multiclassUserLabel, categories);
    } else return null;
  }, [multiclassUserLabel, categories]);

  const modelPredictionCategoryName = useMemo(() => {
    return multiclassModelPrediction !== null
      ? getCategoryNameFromId(multiclassModelPrediction, categories)
      : null;
  }, [multiclassModelPrediction, categories]);

  const elemStyleClasses = useElemStyles({
    elementDOMId,
    prediction: LabelTypesEnum.NONE, //remove
    userLabel: LabelTypesEnum.NONE, //remove
  });

  const [labelMenuOpenAnchorEl, setLabelMenuOpenAnchorEl] = React.useState<
    (EventTarget & globalThis.Element) | null
  >(null);
  const labelMenuOpen = useMemo(
    () => Boolean(labelMenuOpenAnchorEl),
    [labelMenuOpenAnchorEl]
  );

  const evaluationIsInProgress = useAppSelector(
    (state) =>
      state.workspace.panels.panels[PanelIdsEnum.EVALUATION].isInProgress
  );

  return (
    <>
      <Stack
        className={`${classes.element} ${elemStyleClasses.animation} ${
          labelMenuOpen ? classes.hover_element_on_menu_open : ""
        } 
        ${labelButtonClasses.text_element}`}
        id={elementDOMId}
        direction="column"
      >
        <Stack direction={"row"} className={`${elemStyleClasses.prediction} `}>
          <Typography
            className={`${classes.data_text} ${elemStyleClasses.userLabel} ${
              rightToLeft ? classes.right_to_left : ""
            }`}
            // sx={
            //   multiclassUserLabel !== null
            //     ? {
            //         backgroundColor: textColor,
            //       }
            //     : {}
            // }
          >
            {snippet || text}
          </Typography>
          <LabelingButtons
            labelMenuOpen={labelMenuOpen}
            labelMenuOpenAnchorEl={labelMenuOpenAnchorEl}
            setLabelMenuOpenAnchorEl={setLabelMenuOpenAnchorEl}
            element={element}
            handlePosLabelAction={handlePosLabelAction}
            handleNegLabelAction={handleNegLabelAction}
            hideButtons={evaluationIsInProgress}
            otherCatsTooltipProps={{ placement: "top" }}
            panelId={PanelIdsEnum.MAIN_PANEL}
          />
        </Stack>
        <Stack
          direction={"row"}
          sx={{
            mt: 1.5,
            justifyContent: "space-between",
            flexDirection:
              multiclassModelPrediction !== null ? "row" : "row-reverse",
          }}
        >
          {modelPredictionCategoryName && (
            <CategoryBadge
              categoryName={modelPredictionCategoryName}
              color={
                getCategoryColorFromId(multiclassModelPrediction, categories) ||
                undefined
              }
              isModelPrediction
              sx={{ mr: 1 }}
              hideTooltip
            />
          )}
          {labeledCategoryName && (
            <CategoryBadge
              sx={{
                mr: 1,
              }}
              color={
                getCategoryColorFromId(multiclassUserLabel, categories) ||
                undefined
              }
              isUserLabel
              categoryName={labeledCategoryName}
              hideTooltip
            />
          )}
        </Stack>
      </Stack>
      <LabelCategoriesMenu
        anchorEl={labelMenuOpenAnchorEl}
        open={labelMenuOpen}
        setLabelMenuOpenAnchorEl={setLabelMenuOpenAnchorEl}
        element={element}
        panelId={PanelIdsEnum.MAIN_PANEL}
      />
    </>
  );
};

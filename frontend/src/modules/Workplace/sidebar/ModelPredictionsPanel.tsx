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
import { useCallback, useEffect, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../../customHooks/useRedux";
import { nonDeletedCategoriesSelector, setPanelFilters } from "../redux";
import { PanelIdsEnum, WorkspaceMode } from "../../../const";
import { ElementList, Header } from "./components/commonComponents";
import usePanelPagination from "../../../customHooks/usePanelPagination";
import { ArrowsOnlyPagination } from "../../../components/pagination/ArrowsOnlyPagination";
import { Element } from "../../../global";
import ControlledSelect, {
  DropdownOption,
} from "../../../components/dropdown/Dropdown";
import { returnByMode } from "../../../utils/utils";
import { getPredictionsStats } from "../redux/panelsSlice";

const ModelPredictionsPanel = () => {
  const { hitCount } = useAppSelector(
    (state) => state.workspace.panels.panels[PanelIdsEnum.MODEL_PREDICTIONS]
  );
  const loading = useAppSelector(
    (state) => state.workspace.panels.loading[PanelIdsEnum.MODEL_PREDICTIONS]
  );
  const sidebarPanelElementsPerPage = useAppSelector(
    (state) => state.featureFlags.sidebarPanelElementsPerPage
  );
  const nonDeletedCategories = useAppSelector(
    nonDeletedCategoriesSelector,
    (a, b) => {
      return JSON.stringify(a) === JSON.stringify(b);
    }
  );

  const mode = useAppSelector((state) => state.workspace.mode);
  const modelPredictionStats = useAppSelector(
    (state) =>
      state.workspace.panels.panels[PanelIdsEnum.MODEL_PREDICTIONS].stats
  );
  const dispatch = useAppDispatch();

  const filteredValue =
    useAppSelector(
      (state) =>
        state.workspace.panels.panels[PanelIdsEnum.MODEL_PREDICTIONS].filters
          ?.value
    ) || null;

  const setFilteredValue = useCallback(
    (value: string | null) => {
      dispatch(
        setPanelFilters({
          panelId: PanelIdsEnum.MODEL_PREDICTIONS,
          filters: {
            value,
          },
        })
      );
    },
    [dispatch]
  );

  useEffect(() => {
    setFilteredValue(
      mode === WorkspaceMode.BINARY
        ? "true"
        : mode === WorkspaceMode.MULTICLASS
        ? nonDeletedCategories[0].category_id.toString()
        : null
    );
  }, [mode, nonDeletedCategories, setFilteredValue]);

  useEffect(() => {
    dispatch(getPredictionsStats());
  }, [dispatch]);

  const options: DropdownOption[] = useMemo(() => {
    if (mode === WorkspaceMode.BINARY) {
      return [
        {
          value: "true",
          title: "Positive",
          chip:
            Object.keys(modelPredictionStats).length > 0
              ? modelPredictionStats["true"].count.toString()
              : undefined,
        },
        {
          value: "false",
          title: "Negative",
          chip:
            Object.keys(modelPredictionStats).length > 0
              ? modelPredictionStats["false"].count.toString()
              : undefined,
        },
      ];
    } else if (mode === WorkspaceMode.MULTICLASS) {
      return nonDeletedCategories.map((item) => ({
        value: item.category_id.toString(),
        title: item.category_name,
        chip:
          Object.keys(modelPredictionStats).length > 0
            ? (
                modelPredictionStats[item.category_id]["count"] as number
              ).toLocaleString()
            : undefined,
        chipColor: item.color?.palette[100],
      }));
    } else return [];
  }, [mode, nonDeletedCategories, modelPredictionStats]);

  const filteredTitle = useMemo(
    // eslint-disable-next-line
    () => options.find((option) => option.value == filteredValue)?.title,
    [filteredValue, options]
  );

  const {
    currentContentData,
    currentPage,
    isPaginationRequired,
    goToPreviousPage,
    goToNextPage,
    pageCount,
  } = usePanelPagination({
    elementsPerPage: sidebarPanelElementsPerPage,
    panelId: PanelIdsEnum.MODEL_PREDICTIONS,
    modelAvailableRequired: true,
    value: filteredValue,
    shouldFetch: filteredValue !== null,
  });

  const nonEmptyResultsMessage = useMemo(() => {
    const startingMessage = `The following examples are predicted by the system to belong to the category '${filteredTitle}'.`;
    const firstElementIndex = sidebarPanelElementsPerPage * (currentPage - 1);
    const finalMessage = ` Displaying predictions ${firstElementIndex + 1} to ${
      currentPage === pageCount
        ? hitCount
        : firstElementIndex + sidebarPanelElementsPerPage
    } out of ${hitCount}.`;
    return startingMessage + finalMessage;
  }, [
    hitCount,
    sidebarPanelElementsPerPage,
    currentPage,
    pageCount,
    filteredTitle,
  ]);

  const handleSelect = (value: string) => {
    setFilteredValue(
      returnByMode(
        value,
        nonDeletedCategories
          .find((c) => {
            // eslint-disable-next-line
            return c.category_id == Number(value);
          })
          ?.category_id.toString(),
        mode
      )
    );
  };

  const Filters: React.FC = () => (
    <ControlledSelect
      sx={{ m: 2, width: "30%", height: "50px" }}
      value={filteredValue !== null ? filteredValue : ""}
      label={""}
      options={options}
      onChange={handleSelect}
      itemMinHeight={40}
    />
  );

  return (
    <Box>
      <Header message={"Predictions"} />
      {currentContentData !== null && (
        <ElementList
          // we are casting because currentContentData can be string[] in the Contradiction panel
          elements={currentContentData as Element[]}
          loading={loading}
          nonEmptyResultsMessage={nonEmptyResultsMessage}
          emptyResultsMessage={""}
          isPaginationRequired={isPaginationRequired}
          Filters={Filters}
        />
      )}

      <ArrowsOnlyPagination
        hitCount={hitCount}
        sidebarPanelElementsPerPage={sidebarPanelElementsPerPage}
        currentPage={currentPage}
        isPaginationRequired={isPaginationRequired}
        goToPreviousPage={goToPreviousPage}
        goToNextPage={goToNextPage}
      />
    </Box>
  );
};

export default ModelPredictionsPanel;

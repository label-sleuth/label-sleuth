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
import { curCategoryNameSelector, setPanelFilters } from "../redux";
import { PanelIdsEnum, WorkspaceMode } from "../../../const";
import { ElementList, Header } from "./components/commonComponents";
import usePanelPagination from "../../../customHooks/usePanelPagination";
import { ArrowsOnlyPagination } from "../../../components/pagination/ArrowsOnlyPagination";
import { Element } from "../../../global";
import ControlledSelect, {
  DropdownOption,
} from "../../../components/dropdown/Dropdown";
import { returnByMode } from "../../../utils/utils";

const PosPredictionsPanel = () => {
  const curCategoryName = useAppSelector(curCategoryNameSelector);
  const { hitCount } = useAppSelector(
    (state) => state.workspace.panels.panels[PanelIdsEnum.POSITIVE_PREDICTIONS]
  );
  const loading = useAppSelector(
    (state) => state.workspace.panels.loading[PanelIdsEnum.POSITIVE_PREDICTIONS]
  );
  const sidebarPanelElementsPerPage = useAppSelector(
    (state) => state.featureFlags.sidebarPanelElementsPerPage
  );
  const categories = useAppSelector((state) => state.workspace.categories);
  const mode = useAppSelector((state) => state.workspace.mode);

  const dispatch = useAppDispatch();

  const filteredValue =
    useAppSelector(
      (state) =>
        state.workspace.panels.panels[PanelIdsEnum.POSITIVE_PREDICTIONS].filters
          ?.value
    ) || null;

  const setFilteredValue = useCallback(
    (value: string | null) => {
      dispatch(
        setPanelFilters({
          panelId: PanelIdsEnum.POSITIVE_PREDICTIONS,
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
        ? categories[0].category_id.toString()
        : null
    );
  }, [mode, categories, setFilteredValue]);

  const options: DropdownOption[] = useMemo(() => {
    if (mode === WorkspaceMode.BINARY) {
      return [
        { value: "true", title: "Positive" },
        { value: "false", title: "Negative" },
      ];
    } else if (mode === WorkspaceMode.MULTICLASS) {
      return categories
        .map((item) => ({
          value: item.category_id.toString(),
          title: item.category_name,
        }))
        .sort((a, b) => a.title.localeCompare(b.title));
    } else return [];
  }, [mode, categories]);

  const filteredTitle = useMemo(
    // es
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
    panelId: PanelIdsEnum.POSITIVE_PREDICTIONS,
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
    curCategoryName,
    hitCount,
    sidebarPanelElementsPerPage,
    currentPage,
    pageCount,
  ]);

  const handleSelect = (value: string) => {
    setFilteredValue(
      returnByMode(
        value,
        categories
          .find((c) => {
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

export default PosPredictionsPanel;

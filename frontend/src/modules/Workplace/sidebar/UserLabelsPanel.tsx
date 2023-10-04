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
import { useAppDispatch, useAppSelector } from "../../../customHooks/useRedux";
import { PanelIdsEnum, WorkspaceMode } from "../../../const";
import { ElementList, Header } from "./components/commonComponents";
import usePanelPagination from "../../../customHooks/usePanelPagination";
import { CustomPagination } from "../../../components/pagination/CustomPagination";
import { Element } from "../../../global";
import { useCallback, useEffect, useMemo } from "react";
import ControlledSelect, {
  DropdownOption,
} from "../../../components/dropdown/Dropdown";
import { returnByMode } from "../../../utils/utils";
import { nonDeletedCategoriesSelector, setPanelFilters } from "../redux";

export const UserLabelsPanel = () => {
  const { hitCount } = useAppSelector(
    (state) => state.workspace.panels.panels[PanelIdsEnum.USER_LABELS]
  );
  const curCategory = useAppSelector((state) => state.workspace.curCategory);
  const nonDeletedCategories = useAppSelector(
    nonDeletedCategoriesSelector,
    (a, b) => {
      return JSON.stringify(a) === JSON.stringify(b);
    }
  );

  const labelCount = useAppSelector((state) => state.workspace.labelCount);

  const loading = useAppSelector(
    (state) => state.workspace.panels.loading[PanelIdsEnum.USER_LABELS]
  );

  const sidebarPanelElementsPerPage = useAppSelector(
    (state) => state.featureFlags.sidebarPanelElementsPerPage
  );
  const mode = useAppSelector((state) => state.workspace.mode);

  const dispatch = useAppDispatch();

  const filteredValue =
    useAppSelector(
      (state) =>
        state.workspace.panels.panels[PanelIdsEnum.USER_LABELS].filters?.value
    ) || null;

  const setFilteredValue = useCallback(
    (value: string | null) => {
      dispatch(
        setPanelFilters({
          panelId: PanelIdsEnum.USER_LABELS,
          filters: {
            value,
          },
        })
      );
    },
    [dispatch]
  );

  useEffect(() => {
    if (
      filteredValue === null ||
      // update filter value if current value corresponds to a deleted category
      (mode === WorkspaceMode.MULTICLASS &&
        !nonDeletedCategories.find(
          (c) => c.category_id.toString() === filteredValue
        ))
    ) {
      setFilteredValue(
        mode === WorkspaceMode.BINARY
          ? "true"
          : mode === WorkspaceMode.MULTICLASS
          ? nonDeletedCategories[0].category_id.toString()
          : null
      );
    }
  }, [mode, nonDeletedCategories, setFilteredValue, filteredValue]);

  const options: DropdownOption[] = useMemo(() => {
    if (mode === WorkspaceMode.BINARY) {
      return [
        {
          value: "true",
          title: "Positive",
          chip: labelCount["pos"].toString(),
        },
        {
          value: "false",
          title: "Negative",
          chip: labelCount["neg"].toString(),
        },
      ];
    } else if (mode === WorkspaceMode.MULTICLASS) {
      return nonDeletedCategories.map((item) => ({
        value: item.category_id.toString(),
        title: item.category_name,
        chip: (labelCount as { [key: string]: number })[
          item.category_id.toString()
        ].toLocaleString(),
        chipColor: item.color?.palette[100],
      }));
    } else return [];
  }, [mode, nonDeletedCategories, labelCount]);

  const filteredTitle = useMemo(
    // eslint-disable-next-line
    () => options.find((option) => option.value == filteredValue)?.title,
    [filteredValue, options]
  );

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

  const {
    currentContentData,
    currentPage,
    onPageChange,
    isPaginationRequired,
  } = usePanelPagination({
    elementsPerPage: sidebarPanelElementsPerPage,
    panelId: PanelIdsEnum.USER_LABELS,
    modelAvailableRequired: false,
    otherDependencies: [curCategory],
    value: filteredValue,
    shouldFetch: filteredValue !== null,
  });

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

  const emptyResultsMessage = useMemo(() => {
    return mode === WorkspaceMode.BINARY
      ? `No elements are currently labeled as ${filteredTitle} for this category.`
      : `No elements are currently labeled as ${filteredTitle}.`;
  }, [mode, filteredTitle]);
  
  return (
    <Box>
      <Header message={"User labels"} />
      <ElementList
        elements={currentContentData as Element[]}
        loading={loading}
        nonEmptyResultsMessage={`These are all the examples labeled by you as '${filteredTitle}'.`}
        emptyResultsMessage={emptyResultsMessage}
        isPaginationRequired={isPaginationRequired}
        Filters={Filters}
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

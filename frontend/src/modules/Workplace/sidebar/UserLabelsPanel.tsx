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
import { setPanelFilters } from "../redux";

export const UserLabelsPanel = () => {
  const { hitCount } = useAppSelector(
    (state) => state.workspace.panels.panels[PanelIdsEnum.POSITIVE_LABELS]
  );
  const curCategory = useAppSelector((state) => state.workspace.curCategory);

  const loading = useAppSelector(
    (state) => state.workspace.panels.loading[PanelIdsEnum.POSITIVE_LABELS]
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
        state.workspace.panels.panels[PanelIdsEnum.POSITIVE_LABELS].filters
          ?.value
    ) || null;

  const setFilteredValue = useCallback((value: string | null) => {
    dispatch(
      setPanelFilters({
        panelId: PanelIdsEnum.POSITIVE_LABELS,
        filters: {
          value,
        },
      })
    );
  }, [dispatch]);

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


  const {
    currentContentData,
    currentPage,
    onPageChange,
    isPaginationRequired,
  } = usePanelPagination({
    elementsPerPage: sidebarPanelElementsPerPage,
    panelId: PanelIdsEnum.POSITIVE_LABELS,
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
    />
  );

  return (
    <Box>
      <Header message={"User labels"} />
      <ElementList
        elements={currentContentData as Element[]}
        loading={loading}
        nonEmptyResultsMessage={`These are all the examples labeled by you as '${filteredTitle}'.`}
        emptyResultsMessage={
          "You didn't label any elements as positive so far."
        }
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

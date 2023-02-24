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

import { setSearchInput } from "../modules/Workplace/redux";
import { PanelIdsEnum } from "../const";
import { useFetchPanelElements } from "./useFetchPanelElements";
import { useAppDispatch, useAppSelector } from "./useRedux";
import React from "react";

interface UseSearchElementProps {
  textInputRef: React.ForwardedRef<HTMLInputElement | null>;
  resetPagination: () => void;
}

const useSearchElement = ({ textInputRef, resetPagination }: UseSearchElementProps) => {
  const dispatch = useAppDispatch();

  const searchInput = useAppSelector((state) => state.workspace.panels.panels[PanelIdsEnum.SEARCH].input);

  const fetchSearchPanelElements = useFetchPanelElements({ panelId: PanelIdsEnum.SEARCH });

  const handleSearch = () => {
    if (searchInput !== "") {
      resetPagination();
      fetchSearchPanelElements();
      // forwardRefs can be a function or a ref, we narrow the type because we only use passing a ref and not a function
      if (typeof textInputRef === "function") return;
      textInputRef !== null && textInputRef.current !== null && textInputRef.current.blur();
    }
  };

  const handleSearchInputChange = (event: React.FormEvent) => {
    dispatch(setSearchInput((event.target as HTMLInputElement).value));
  };

  const handleSearchInputEnterKey = (ev: React.KeyboardEvent) => {
    if (ev && ev.key) {
      if (ev.key === "Enter") {
        handleSearch();
        ev.preventDefault();
      }
    }
  };

  return {
    handleSearch,
    handleSearchInputChange,
    searchInput,
    handleSearchInputEnterKey,
  };
};

export default useSearchElement;

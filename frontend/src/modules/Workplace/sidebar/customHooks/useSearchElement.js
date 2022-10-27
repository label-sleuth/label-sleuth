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

import { setSearchInput } from "../../redux/DataSlice";
import { useDispatch, useSelector } from "react-redux";
import { panelIds } from "../../../../const";
import { useFetchPanelElements } from "../../customHooks/useFetchPanelElements";

const useSearchElement = (resetPagination) => {
  const searchInput = useSelector((state) => state.workspace.panels[panelIds.SEARCH].input);

  const dispatch = useDispatch();

  const fetchSearchPanelElements = useFetchPanelElements({ panelId: panelIds.SEARCH });

  const handleSearch = () => {
    if (searchInput !== "") {
      resetPagination();
      fetchSearchPanelElements();
    }
  };

  const handleSearchInputChange = (event) => {
    dispatch(setSearchInput(event.target.value));
  };

  const handleSearchInputEnterKey = (ev) => {
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

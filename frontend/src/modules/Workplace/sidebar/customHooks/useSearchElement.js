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

import { useEffect } from 'react';
import { searchKeywords } from '../../DataSlice.jsx';
import {
    setFocusedState,
    fetchCertainDocument,
    setIsDocLoaded,
    setSearchedIndex,
    setIsSearchActive,
    setSearchInput,
} from '../../DataSlice';
import { useDispatch, useSelector } from 'react-redux';

const useSearchElement = () => {

    const workspace = useSelector(state => state.workspace)
    const isDocLoaded = useSelector(state => state.workspace.isDocLoaded)
    const isSearchActive = useSelector(state => state.workspace.isSearchActive)
    const focusedIndex = useSelector(state => state.workspace.focusedIndex)
    const searchedIndex = useSelector(state => state.workspace.searchedIndex)
    const searchInput = useSelector(state => state.workspace.searchInput)

    const dispatch = useDispatch()

    const handleSearch = () => {
        if (searchInput) {
            dispatch(searchKeywords())
        }
        else {
            dispatch(setSearchInput(""))
        }
    }

    const handleSearchInputChange = (event) => {
        dispatch(setSearchInput(event.target.value))
    }

    const scrollIntoElementView = (element) => {
        element && element.scrollIntoView({
            behavior: "smooth",
            block: "center"
        })
    }

    useEffect(() => {
        if (isSearchActive && isDocLoaded) {
            let element
            if (workspace.curCategory !== null) {
                element = document.getElementById('L' + focusedIndex);
            }
            else {
                element = document.getElementById('L' + searchedIndex);
            }
            scrollIntoElementView(element)
            dispatch(setIsSearchActive(false))
        }
    }, [isSearchActive, isDocLoaded, workspace.curCategory, focusedIndex, scrollIntoElementView, setIsSearchActive])


    const handleSearchPanelClick = (docid, id) => {
        
        const lastIndex = id.lastIndexOf('-');
        const index = id.slice(lastIndex + 1);
        dispatch(setSearchedIndex(index))
        dispatch(setIsSearchActive(true))
        const element = document.getElementById('L' + index);
        scrollIntoElementView(element)

        if (docid != workspace.curDocName) {
            dispatch(setIsDocLoaded(false))
            dispatch(fetchCertainDocument({ docid, id, switchStatus: 'switch' })).then(() => {
                dispatch(setFocusedState(index))
                dispatch(setIsDocLoaded(true))
            })
        } else {
            dispatch(setFocusedState(index))
        }

    }

    const handleSearchInputEnterKey = (ev) => {
        if (ev && ev.key) {
            if (ev.key === 'Enter') {
                handleSearch()
                ev.preventDefault();
            }
        }
    }

    return {
        handleSearchPanelClick,
        handleSearch,
        handleSearchInputChange,
        searchInput,
        handleSearchInputEnterKey
    }
};

export default useSearchElement;
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

import * as React from 'react';
import { useSelector } from 'react-redux';
import '../../../../components/pagination/pagination.css'

const useMainPagination = (searchedIndex, numOfElemPerPage) => {

    const workspace = useSelector(state => state.workspace)
    const len_elements = workspace['elements'].length
    const [currentPage, setCurrentPage] = React.useState(1);
    let [firstPageIndex, setFirstPageIndex] = React.useState()
    let [lastPageIndex, setLastPageIndex] = React.useState()
    let currPageNum = Math.ceil(parseInt(searchedIndex) / parseInt(numOfElemPerPage))
    let currPageNumMod = parseInt(searchedIndex)% parseInt(numOfElemPerPage)

    React.useEffect(() => {
        if (!searchedIndex) {
            setCurrentPage(1)
        }
        else {
            if(currPageNumMod == 0){
                setCurrentPage(currPageNum+1)
            }
            else{
                setCurrentPage(currPageNum)
            }
        }

    }, [workspace.curDocId, setCurrentPage, searchedIndex, numOfElemPerPage])

    const currentContentData = React.useMemo(() => {
        let firstPageIndex = 0;

        if (currentPage > 0) {
            firstPageIndex = (currentPage-1) * numOfElemPerPage;
        }

        const lastPageIndex = firstPageIndex + numOfElemPerPage;
        setFirstPageIndex(firstPageIndex)
        setLastPageIndex(lastPageIndex)
        return workspace.elements.slice(firstPageIndex, lastPageIndex);
    }, [workspace.elements, currentPage, numOfElemPerPage, workspace.curDocId, len_elements]);

    return {
        currentContentData,
        setCurrentPage,
        currentPage,
        lastPageIndex,
        firstPageIndex
    }
};

export default useMainPagination;
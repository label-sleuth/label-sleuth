import * as React from 'react';
import { useSelector } from 'react-redux';
import '../../../components/pagination/pagination.css'

const useMainPagination = (searchedIndex, numOfElemPerPage) => {

    const workspace = useSelector(state => state.workspace)
    const len_elements = workspace['elements'].length
    const [currentPage, setCurrentPage] = React.useState(1);
    let [firstPageIndex, setFirstPageIndex] = React.useState()
    let [lastPageIndex, setLastPageIndex] = React.useState()
 
    React.useEffect(() => {
        if (!searchedIndex) {
            setCurrentPage(1)
        }
        else {
            let currPageNum = Math.ceil((searchedIndex+1) / numOfElemPerPage)
            setCurrentPage(currPageNum)
        }

    }, [workspace.curDocId, setCurrentPage, searchedIndex, numOfElemPerPage])

    const currentContentData = React.useMemo(() => {
        const firstPageIndex = (currentPage - 1) * numOfElemPerPage;
        const lastPageIndex = firstPageIndex + numOfElemPerPage;
        setFirstPageIndex(firstPageIndex)
        setLastPageIndex(lastPageIndex)
        return workspace.elements.slice(firstPageIndex, lastPageIndex);
    }, [currentPage, numOfElemPerPage, workspace.curDocId, len_elements]);

    return {
        currentContentData,
        setCurrentPage,
        currentPage,
        lastPageIndex,
        firstPageIndex
    }
};

export default useMainPagination;
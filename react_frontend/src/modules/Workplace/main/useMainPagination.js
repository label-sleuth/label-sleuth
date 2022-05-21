import * as React from 'react';
import { useSelector } from 'react-redux';
import '../../../components/pagination/pagination.css'

const useMainPagination = (searchedItem, numOfElemPerPage) => {

    const workspace = useSelector(state => state.workspace)
    const len_elements = workspace['elements'].length
    const [currentPage, setCurrentPage] = React.useState(1);
    const [searchedItemIndex, setsearchedItemIndex] = React.useState()

    React.useEffect(() => {
        if (!searchedItem) {
            setCurrentPage(1)
        }
        else {
            const splits = searchedItem.split("-")
            const index = parseInt(splits[splits.length - 1])
            setsearchedItemIndex(index)
            let currPageNum = Math.ceil((index+1) / numOfElemPerPage)
            setCurrentPage(currPageNum)
        }

    }, [workspace.curDocId, setCurrentPage, searchedItem, setsearchedItemIndex, numOfElemPerPage])

    const currentContentData = React.useMemo(() => {
        const firstPageIndex = (currentPage - 1) * numOfElemPerPage;
        const lastPageIndex = firstPageIndex + numOfElemPerPage;
        return workspace.elements.slice(firstPageIndex, lastPageIndex);
    }, [currentPage, numOfElemPerPage, workspace.curDocId, len_elements]);

    return {
        currentContentData,
        setCurrentPage,
        currentPage,
        searchedItemIndex
    }
};

export default useMainPagination;
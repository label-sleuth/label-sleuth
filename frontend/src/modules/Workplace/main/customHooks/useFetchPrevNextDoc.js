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

import { fetchPrevDocElements, fetchNextDocElements, } from '../../DataSlice.jsx';
import { useDispatch, useSelector } from 'react-redux';

const useFetchPrevNextDoc = () => {
    const workspace = useSelector(state => state.workspace)
    const dispatch = useDispatch()

    const scrollIntoElementView = () => {
        const element = document.getElementById('L0')
        element && element.scrollIntoView({
            behavior: "smooth",
            block: "center"
        })
    }

    const handleFetchNextDoc = () => {
        if (workspace.curDocId < workspace.documents.length - 1) {
            dispatch(fetchNextDocElements()).then(() => {
                scrollIntoElementView()
            })
        }
    }

    const handleFetchPrevDoc = () => {
        if (workspace.curDocId > 0) {
            dispatch(fetchPrevDocElements()).then(() => {
                scrollIntoElementView()
            })
        }
    }

    return {
        handleFetchPrevDoc,
        handleFetchNextDoc,
    }
}
export default useFetchPrevNextDoc;


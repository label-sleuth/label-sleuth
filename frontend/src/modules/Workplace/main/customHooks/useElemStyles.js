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


import classes from '../Element.module.css';
import { useSelector } from 'react-redux';

const useElemStyles = ({ index, prediction }) => {

    const workspace = useSelector(state => state.workspace)
    let textElemStyle = classes["text_normal"]

    const text_colors = {
        'pos': { color: '#3092ab' },
        'neg': { color: '#bd3951' },
        'ques': { color: '#cfae44' }
    }

    const handleTextElemStyle = () => {
        if (workspace["focusedIndex"] == index && (prediction == "false" || !prediction) ) {
            textElemStyle = classes["text_auto_focus"] 
        }
        else if (workspace["focusedIndex"] == index && prediction == "true"){
            textElemStyle = classes["text_auto_focus_pred"] 
        }
        else if (prediction == "true"){
            textElemStyle = classes["text_predict"]
        }
        else {
            textElemStyle = classes["text_normal"]
        }
        return textElemStyle
    }

    return {
        handleTextElemStyle,
        text_colors,
    }
};

export default useElemStyles;
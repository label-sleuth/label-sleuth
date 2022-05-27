
import classes from './Element.module.css';
import { useSelector } from 'react-redux';

const useElemStyles = ({ index, prediction, searchedItemIndex, numOfElemPerPage}) => {
    
    const workspace = useSelector(state => state.workspace)
    let textElemStyle = classes["text_normal"]

    const text_colors = {
        'pos': { color: '#3092ab' },
        'neg': { color: '#bd3951' },
        'ques': { color: '#cfae44' }
    }

    const handleTextElemStyle = () => {

        if ((workspace["focusedIndex"] == index
        ) || ((searchedItemIndex % numOfElemPerPage) == index
            )) {
            textElemStyle = classes["text_focus"]
        }
        else if (prediction[index]) {
            textElemStyle = classes["text_predict"]
        }
        else {
            textElemStyle = classes["text_normal"]
        }
        return textElemStyle
    }

    return  {
        handleTextElemStyle,
        text_colors,
    }
};

export default useElemStyles;
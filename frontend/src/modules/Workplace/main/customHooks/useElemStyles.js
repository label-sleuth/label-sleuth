
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
        if (workspace["focusedIndex"] == index && workspace["focusedIndex"] > 0) {
            textElemStyle = classes["text_focus"]
        }
        else if (prediction && prediction[index]) {
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
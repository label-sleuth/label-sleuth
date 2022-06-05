import classes from '../SearchPanel.module.css';

const useSearchPanelStyles = (prediction) => {

    const text_colors = {
        'pos': { color: '#3092ab' },
        'neg': { color: '#bd3951' }
    }

    const handleTextElemStyle = () => {
        let textElemStyle = classes["text_confused"]

        if (prediction == "true") {
            textElemStyle = classes["text_predict"]
        }

        return textElemStyle
    }
    return {
        handleTextElemStyle,
        text_colors,
    }
};

export default useSearchPanelStyles;
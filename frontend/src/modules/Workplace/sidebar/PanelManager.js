import React from "react";
import { Box } from '@mui/material';
import useSearchElement from "./customHooks/useSearchElement";


export const PanelManager = ({ updateMainLabelState, children }) => {

    const { handleSearchPanelClick,
        handleSearchInputEnterKey,
        handleSearch,
        clearSearchInput,
        handleSearchInputChange,
        textInput,
        searchInput } = useSearchElement()

    const childrenWithProps = React.Children.map(children, child => {
        if (child) {
            // TODO - when refactoring the main 
            // if (child.type.name == "MainPanel") {
            //     return React.cloneElement(child, {
            //         updateMainLabelState,
            //     });
            // }
            if (child.type.name == "SearchPanel") {
                return React.cloneElement(child, {
                    handleSearchPanelClick,
                    handleSearchInputEnterKey,
                    handleSearch,
                    clearSearchInput,
                    handleSearchInputChange,
                    textInput,
                    searchInput,
                    updateMainLabelState,
                });
            }
            else if (child.type.name == "RecToLabelPanel") {
                return React.cloneElement(child, {
                    handleSearchPanelClick,
                    searchInput,
                    updateMainLabelState,
                });
            }
        }
        else return child
    });

    return (
        <Box>
            {childrenWithProps}
        </Box>
    )
}


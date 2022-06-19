import React from "react";
import { Box } from '@mui/material';
import useSearchElement from "./customHooks/useSearchElement";

import { SEARCH, RCMD } from '../../../const'

export const PanelManager = ({ activePanel, updateMainLabelState, children }) => {

    const { handleSearchPanelClick,
        handleSearchInputEnterKey,
        handleSearch,
        handleSearchInputChange,
        searchInput } = useSearchElement()

    const childrenWithProps = React.Children.map(children, child => {
        if (child) {
            // TODO - when refactoring the main 
            // if (activePanel == MAIN) {
            //     return React.cloneElement(child, {
            //         updateMainLabelState,
            //     });
            // }

            if (activePanel == SEARCH) {
                return React.cloneElement(child, {
                    handleSearchPanelClick,
                    handleSearchInputEnterKey,
                    handleSearch,
                    handleSearchInputChange,
                    searchInput,
                    updateMainLabelState,
                });
            }

            else if (activePanel == RCMD) {
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


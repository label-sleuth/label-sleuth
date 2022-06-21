import React from "react";
import { Box } from '@mui/material';
import useSearchElement from "./sidebar/customHooks/useSearchElement";
import Drawer from '@mui/material/Drawer';
import useUpdateLabelState from "./sidebar/customHooks/useUpdateLabelState";
import { SEARCH, RCMD, RIGHT_DRAWER_WIDTH } from '../../const'
import MainPanel from "./main/MainPanel";

export const PanelManager = ({ activePanel, 
    children, 
    handleKeyEvent, 
    open, 
    handleDrawerClose }) => {

    const { updateSearchLabelState, updateRecLabelState, updateMainLabelState } = useUpdateLabelState()

    const { handleSearchPanelClick,
        handleSearchInputEnterKey,
        handleSearch,
        handleSearchInputChange,
        searchInput } = useSearchElement()

    const activePanelWithProps = React.Children.map(children, child => {

        if (child) {
            if (activePanel == SEARCH) {
                return React.cloneElement(child, {
                    handleSearchPanelClick,
                    handleSearchInputEnterKey,
                    handleSearch,
                    handleSearchInputChange,
                    searchInput,
                    updateMainLabelState,
                    updateLabelState: updateSearchLabelState,
                    handleKeyEvent,
                    open,
                    handleDrawerClose,
                });
            }
            else if (activePanel == RCMD) {
                return React.cloneElement(child, {
                    handleSearchPanelClick,
                    searchInput,
                    updateMainLabelState,
                    updateLabelState: updateRecLabelState,
                    open,
                    handleDrawerClose,
                });
            }
        }
        else return child
    });

    return (
        <Box>
           <MainPanel handleKeyEvent={handleKeyEvent} open={open} />
            <Drawer sx={{
                width: RIGHT_DRAWER_WIDTH, flexShrink: 0,
                '& .MuiDrawer-paper': {
                    width: RIGHT_DRAWER_WIDTH,
                    boxSizing: 'border-box',
                }
            }}
                PaperProps={{ sx: { backgroundColor: "#f8f9fa !important", right: 50, } }}
                variant="persistent"
                anchor="right"
                open={open}
                onClose={handleDrawerClose}
            >
                {activePanelWithProps}
            </Drawer>
        </Box>
    )
}


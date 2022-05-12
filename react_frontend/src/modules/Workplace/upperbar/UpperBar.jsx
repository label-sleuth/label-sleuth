import * as React from 'react';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import '../styles.css'
import useScrollTrigger from '@mui/material/useScrollTrigger';
import { useDispatch, useSelector } from 'react-redux';
import { nextPrediction,  updateCurCategory, setFocusedState } from '../DataSlice.jsx';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import Button from '@mui/material/Button';

const rightDrawerWidth = 360;

const ToolBar = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing(1, 2),
    // necessary for content to be below app bar
    // ...theme.mixins.toolbar,
  }));

function ElevationScroll(props) {
    const { children, window } = props;
    // Note that you normally won't need to set the window ref as useScrollTrigger
    // will default to window.
    // This is only being set here because the demo is in an iframe.
    const trigger = useScrollTrigger({
      disableHysteresis: true,
      threshold: 0,
      target: window ? window() : undefined,
    });
  
    return React.cloneElement(children, {
      elevation: trigger ? 4 : 0,
    });
  }
  
  const AppBar = styled(Box, {
    shouldForwardProp: (prop) => prop !== 'open',
  })(({ theme, open }) => ({
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    ...(open && {
      width: `calc(100% - ${rightDrawerWidth}px)`,
      transition: theme.transitions.create(['margin', 'width'], {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
      marginRight: rightDrawerWidth,
    }),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  }));
  
  function CategoryFormControl(props) {

    const workspace = useSelector(state => state.workspace)
    const dispatch = useDispatch()
  
    return (
      <FormControl className="select_category">
        <Select
          id="label-select"
          value={workspace.curCategory}
          onChange={(e) => {
            dispatch(updateCurCategory(e.target.value))
          }}>
          {
            workspace.new_categories.map((category, index) => {
              return (<MenuItem  key ={index} value={category}  sx={{display: "list-item !important", padding: '5px 0 5px 5px !important' } }>{category}</MenuItem>)
            })
          }
          {
            workspace.categories.map((e, i) => {
              return (<MenuItem   key ={i} value={e.id} sx={{display: "list-item !important" ,  padding: '5px 0 5px 5px !important' } }>{e.category_name}</MenuItem>)
            })
          }
        </Select>
        {/* <FormHelperText>With label + helper text</FormHelperText> */}
      </FormControl>
    );
  }
  
  
const UpperBar = ({setNumLabel, setModalOpen, setNumLabelGlobal, open}) => {

    const workspace = useSelector(state => state.workspace)
    const dispatch = useDispatch()

    return (
        <ElevationScroll>
          <AppBar className="elevation_scroll" open={open}>
            <Box sx={{ display: "flex", flexDirection: "row", alignItems: 'center', justifyContent: 'space-between', }}>
              <Typography><strong>Category:</strong></Typography>
              <CategoryFormControl numLabelGlobalHandler={setNumLabelGlobal} numLabelHandler={setNumLabel} />
              <a className="create_new_category" onClick={() => setModalOpen(true)} >
                <span>New Category</span>
              </a>
            </Box>
            <ToolBar>
              <Button className="btn" onClick={() => {
                dispatch(nextPrediction())
                dispatch(setFocusedState(workspace.indexPrediction))

                document.getElementById('L' + workspace.indexPrediction).scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                  // inline: "nearest"
                })
              }}>
                Next Positive Prediction <i className="fa fa-forward"></i>
              </Button>
              
            </ToolBar>
          </AppBar>
        </ElevationScroll>
    );
};

export default UpperBar;

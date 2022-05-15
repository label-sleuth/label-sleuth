import * as React from 'react';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import '../styles.css'
import useScrollTrigger from '@mui/material/useScrollTrigger';
import { useDispatch, useSelector } from 'react-redux';
import { nextPrediction, updateCurCategory, setFocusedState } from '../DataSlice.jsx';
import FormControl from '@mui/material/FormControl';
import Button from '@mui/material/Button';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import { IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ControlledSelect from '../../../components/Dropdown';
import ReactTooltip from 'react-tooltip';

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
  const { workspaceLength } = props
  const workspace = useSelector(state => state.workspace)
  const dispatch = useDispatch()
  const [selValue, setSelVal] = React.useState()

  React.useEffect(() => {
    if (workspace.categories.length !== 0 && (workspaceLength == workspace.categories.length)) {
      setSelVal(workspace.categories[workspace.categories.length - 1].id)
    }

  }, [workspace.categories.length, workspaceLength])

  const options = workspace.categories.map((item) => ({ value: item.category_name, title: item.category_name }))

  const handleCategorySelect = (value) => {
    dispatch(updateCurCategory(value))
    setSelVal(value)
  }

  return (
    <FormControl variant="standard" sx={{ m: 2, minWidth: 150, maxWidth: 150, marginBottom: 3.5 }}>
      <ControlledSelect
        id="label-select"
        value={selValue}
        onChange={handleCategorySelect}
        options={options}
      />

    </FormControl>
  );
}


const UpperBar = ({ setNumLabel, setModalOpen, setNumLabelGlobal, open }) => {

  const workspace = useSelector(state => state.workspace)
  const dispatch = useDispatch()
  const workspaceLength = useSelector(state => state.workspace.workspaceLength)

  const handleAddCategory = () => {
    setModalOpen(true)
  }

  return (
    <ElevationScroll>
      <AppBar className="elevation_scroll" open={open}>
        <Box sx={{ display: "flex", flexDirection: "row", alignItems: 'center', justifyContent: 'space-between', }}>
          <Typography><strong>Category:</strong></Typography>
          <CategoryFormControl numLabelGlobalHandler={setNumLabelGlobal} numLabelHandler={setNumLabel} workspaceLength={workspaceLength} />
          <IconButton onClick={handleAddCategory}>
            <AddCircleIcon color="primary" />
          </IconButton>

          {/* TODO 
                <IconButton onClick={() => setModalOpen(false)} >
                  <EditIcon  color="success" />
                </IconButton>
                <IconButton onClick={() => setModalOpen(false)} >
                  <DeleteIcon  color="error" />
                </IconButton>
             */}

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

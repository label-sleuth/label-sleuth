import * as React from 'react';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import add_icon from '../../../assets/workspace/add_icon.svg';
import next_icon from '../../../assets/workspace/right_icon.svg';
import classes from './UpperBar.module.css';
import useScrollTrigger from '@mui/material/useScrollTrigger';
import { useDispatch, useSelector } from 'react-redux';
import { nextPrediction, updateCurCategory, setFocusedState } from '../DataSlice.jsx';
import FormControl from '@mui/material/FormControl';
import ControlledSelect from '../../../components/dropdown/Dropdown';

const rightDrawerWidth = 360;
const leftDrawerWidthh = 280;

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

const AppBar = styled(Box, { shouldForwardProp: (prop) => prop !== 'open', })(({ theme, open }) => ({
  transition: theme.transitions.create(['padding', 'width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    transition: theme.transitions.create(['padding', 'width'], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    paddingRight: `${rightDrawerWidth + 20}px`,
  }),
  width: `calc(100vw - ${leftDrawerWidthh + 48}px)`,
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

  const options = workspace.categories
    .map((item) => ({ value: item.category_name, title: item.category_name }))
    .sort((a, b) => a.value.localeCompare(b.value));
  // TODO: insert sorted when categories are added

  const handleCategorySelect = (value) => {
    dispatch(updateCurCategory(value))
    setSelVal(value)
  }

  return (
    <FormControl variant="standard" sx={{ minWidth: '200px', marginBottom: '16px' }}>
      <ControlledSelect
        id="label-select"
        value={selValue}
        onChange={handleCategorySelect}
        options={options}
        placholder="placeholder"
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
      <AppBar className={classes.elevation_scroll} open={open}>

        <div className={classes.upper}>
          <p>Category: </p>
          <CategoryFormControl
            numLabelGlobalHandler={setNumLabelGlobal}
            numLabelHandler={setNumLabel}
            workspaceLength={workspaceLength}
            placholder="placeholder" />

          <button onClick={handleAddCategory} alt="Create new category">
            <img src={add_icon} />
          </button>
          {/* TODO 
              <IconButton onClick={() => setModalOpen(false)} >
                <EditIcon  color="success" />
              </IconButton>
              <IconButton onClick={() => setModalOpen(false)} >
                <DeleteIcon  color="error" />
              </IconButton>
            */}
        </div>
        <button
          className={classes.nextbtn} onClick={() => {
            dispatch(nextPrediction())
            dispatch(setFocusedState(workspace.indexPrediction))
            document.getElementById('L' + workspace.indexPrediction).scrollIntoView({
              behavior: "smooth",
              block: "start",
              // inline: "nearest"
            })
          }}>
          Next Prediction <img src={next_icon} />
        </button>
      </AppBar>
    </ElevationScroll>
  );
};

export default UpperBar;

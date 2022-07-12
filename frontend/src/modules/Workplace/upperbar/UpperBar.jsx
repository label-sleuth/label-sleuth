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

import * as React from 'react';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import add_icon from '../../../assets/workspace/add_icon.svg';
import next_icon from '../../../assets/workspace/right_icon.svg';
import classes from './UpperBar.module.css';
import useScrollTrigger from '@mui/material/useScrollTrigger';
import { useDispatch, useSelector } from 'react-redux';
import { updateCurCategory } from '../DataSlice.jsx';
import FormControl from '@mui/material/FormControl';
import ControlledSelect from '../../../components/dropdown/Dropdown';
import Tooltip from '@mui/material/Tooltip';
import { CREATE_NEW_CATEGORY_TOOLTIP_MSG } from '../../../const';
import { CategoryCard } from './CategoryCard'

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
    paddingRight: `${rightDrawerWidth + 80}px`,
  }),
  // width: `calc(100vw - ${leftDrawerWidthh + 48}px)`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
}));

function CategoryFormControl() {
  const curCategory = useSelector(state => state.workspace.curCategory)
  const categories = useSelector(state => state.workspace.categories)
  const dispatch = useDispatch()
  const [selValue, setSelVal] = React.useState()

  React.useEffect(() => {
    setSelVal(curCategory)
  }, [curCategory])

  const options = categories
    .map((item) => ({ value: item.category_id, label: item.category_name }))
    .sort((a, b) => a.label.localeCompare(b.label));
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

const UpperBar = ({ setNumLabel, setModalOpen, open }) => {
  
  const curCategory = useSelector(state => state.workspace.curCategory)
  
  const [cardOpen, setCardOpen] = React.useState(true)

  const handleAddCategory = () => {
    setModalOpen(true)
  }

  React.useEffect(() => {
    if (curCategory && cardOpen) {
      setCardOpen(false)
    } 
  }, [curCategory])

  return (
    <ElevationScroll>
      <AppBar className={classes.elevation_scroll} open={open}>
        <div className={classes.upper}>
          <p>Category: </p>
          <CategoryFormControl
            placholder="placeholder" />

          <Tooltip title={CREATE_NEW_CATEGORY_TOOLTIP_MSG} disableFocusListener>
            <button
              onClick={handleAddCategory}
              alt="Create new category"
              id="upperbar-add-category"
              className={classes["add-category-button"]}
            >
              <img src={add_icon} />
            </button>
          </Tooltip>
          {cardOpen ? <CategoryCard setCardOpen={setCardOpen} /> : null}
          {/* TODO 
              <IconButton onClick={() => setModalOpen(false)} >
                <EditIcon  color="success" />
              </IconButton>
              <IconButton onClick={() => setModalOpen(false)} >
                <DeleteIcon  color="error" />
              </IconButton>
            */}
        </div>
      </AppBar>
    </ElevationScroll>
  );
};

export default UpperBar;

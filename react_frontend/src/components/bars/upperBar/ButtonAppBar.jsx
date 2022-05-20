import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import sleuth_logo from "../../../assets/sleuth_logo.png";

export default function ButtonAppBar({logout}) {
  return (
    <Box sx={{ flexGrow: 1  }}>
      <AppBar position="static" style={{boxShadow: 'none'}}>
        <Toolbar
          style={{
            background: '#161616',
            borderBottom: 'solid 1px #b5b5b5',
            minHeight: 0,
            paddingLeft: '20px',
            paddingRight: '12px',
            height: '48px'
          }}>
          <IconButton
            size="medium"
            edge="start"
            color="inherit"
            aria-label="menu"
            style={{ marginRight: '6px'}}
          >
          <img src={sleuth_logo} style={{ width: '20px', height: '20px'}}/>
          </IconButton>
          <Typography variant="p" component="div" style={{ flexGrow: 1, paddingTop: '2px' }}><b style={{fontWeight: 600}}>SLEUTH</b> by IBM Research</Typography>
          <Button color="inherit" onClick={logout}>Logout</Button>
        </Toolbar>
      </AppBar>
    </Box>
  );
}
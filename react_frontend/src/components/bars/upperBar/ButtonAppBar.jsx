import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';

export default function ButtonAppBar({logout}) {
  return (
    <Box sx={{ flexGrow: 1  }}>
      <AppBar position="static">
        <Toolbar  sx={{ bgcolor: "#f48c06" }}>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          IBM Research - SLEUTH
          </Typography>
          <Button color="inherit" onClick={logout}>Logout</Button>
        </Toolbar>
      </AppBar>
    </Box>
  );
}
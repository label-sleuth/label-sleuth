import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import theme from './theme.jsx';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import configureStore from "./store/configureStore";
import { Provider } from 'react-redux'
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

ReactDOM.render(
  <Provider store={configureStore}>
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        <App ToastContainer={ToastContainer} toast={toast} />
      </BrowserRouter>
    </ThemeProvider>
  </Provider>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

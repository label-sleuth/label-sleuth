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

import { render } from "react-dom";
import "./index.css";
import App from "./App";
import "react-toastify/dist/ReactToastify.css";
import { Provider } from "react-redux";
import { setupStore } from "./store/configureStore";
import { ToastContainer } from "react-toastify";

render(
  <Provider store={setupStore()}>
    <ToastContainer position="top-center" hideProgressBar={true} autoClose={7000} theme="dark" style={{zIndex: 10001}}/>
    <App />
  </Provider>,
  document.getElementById("root")
);

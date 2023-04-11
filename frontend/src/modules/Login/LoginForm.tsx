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

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import Box from "@mui/material/Box";
import ButtonIBM from "../../components/buttons/ButtonIBM";
import { getAuthenticated, clearState } from "./LoginSlice";
import { WORKSPACE_CONFIG_PATH } from "../../config";
import { useAppDispatch, useAppSelector } from "../../customHooks/useRedux";
import * as React from "react";

import classes from "./login.module.css";
import buttonIBMClasses from "../../components/buttons/Buttons.module.css";
import sleuth_logo from "../../assets/sleuth_logo_white.svg";
import { KeyboardKeysEnum } from "../../const";

const LoginForm: React.FC = () => {
  let navigate = useNavigate();
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.authenticate.token);

  useEffect(() => {
    if (token) {
      navigate(WORKSPACE_CONFIG_PATH);
    }
  }, [navigate, token]);

  const [username, setUserName] = useState("");
  const [password, setPassword] = useState("");

  const handleUserName = (e: React.FormEvent) => {
    setUserName((e.target as HTMLInputElement).value);
  };
  const handlePassword = (e: any) => {
    setPassword((e.target as HTMLInputElement).value);
  };

  const handleLogin = () => {
    dispatch(clearState());
    dispatch(getAuthenticated({ username, password }));
  };

  const onKeyDown = (event: React.KeyboardEvent) : void => {
    if (event.key === KeyboardKeysEnum.ENTER) {
      handleLogin();
    }
  }

  return (
    <Box>
      <div className={classes.sleuth_header}>
        <img alt="existing workspace" src={sleuth_logo} className={classes.sleuthlogo} />
      </div>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "1px",
          width: "auto",
          height: "auto",
          padding: "0",
          background: "#f4f4f4",
          borderLeft: "solid 1px #eaeaea",
          borderTop: "solid 1px #eaeaea",
          borderRight: "solid 1px #b8b8b8",
          borderBottom: "solid 1px #b8b8b8",
        }}
        onKeyDown={onKeyDown}
      >
        <FormControl variant="standard" sx={{ m: 1, minWidth: 350, padding: 0, margin: 0 }}>
          <FormLabel sx={{ color: "#393939", fontWeight: "600", fontSize: "1.5rem", padding: "25px" }}>Login</FormLabel>
          <FormControl
            sx={{
              paddingLeft: "25px",
              paddingTop: "15px",
              paddingBottom: "10px",
              background: "#fff",
              borderBottom: "solid 1px #eaeaea",
            }}
          >
            <TextField
              required
              onChange={handleUserName}
              label="Username"
              variant="standard"
              InputProps={{ disableUnderline: true }}
              inputProps={{
                sx: {
                  "&::placeholder": {
                    color: "#b5b5b5",
                  },
                },
              }}
              InputLabelProps={{ shrink: true }}
              placeholder="sleuth@ibm.com"
              autoFocus
            />
          </FormControl>
          <FormControl
            sx={{
              paddingLeft: "25px",
              paddingTop: "15px",
              paddingBottom: "10px",
              marginBottom: "10px",
              background: "#fff",
            }}
          >
            <TextField
              required
              type="password"
              onChange={handlePassword}
              label="Password"
              variant="standard"
              InputProps={{
                disableUnderline: true,
              }}
              inputProps={{
                sx: {
                  "&::placeholder": {
                    color: "#b5b5b5",
                  },
                },
              }}
              InputLabelProps={{ shrink: true }}
              placeholder="***"
            />
          </FormControl>
          <div style={{ width: "100%", display: "flex", justifyContent: "right", marginTop: "20px" }}>
            <ButtonIBM handleClick={handleLogin} text="Log In" className={buttonIBMClasses["button-ibm"]} />
          </div>
        </FormControl>
      </Box>
    </Box>
  );
};

export default LoginForm;

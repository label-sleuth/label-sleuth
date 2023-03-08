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

import * as React from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Button from "@mui/material/Button";
import sleuth_logo from "../../../assets/sleuth_logo_white.svg";
import { useAuthentication } from "../../../customHooks/useAuthentication";
import { SupportIconsBar } from "../../SupportIconsBar";
import { Divider } from "@mui/material";

interface ButtonAppBarProps {
	logout: (e: React.MouseEvent) => void;
}

export default function ButtonAppBar({ logout }: ButtonAppBarProps) {
	const { authenticationEnabled } = useAuthentication();

	return (
		<Box sx={{ flexGrow: 1 }}>
			<AppBar position="static" style={{ boxShadow: "none" }}>
				<Toolbar
					style={{
						background: "#161616",
						borderBottom: "solid 1px #b5b5b5",
						minHeight: 0,
						paddingLeft: "20px",
						paddingRight: "12px",
						height: "48px",
					}}
				>
					<img
						src={sleuth_logo}
						style={{ width: "160px", maxWidth: "160px" }}
						alt="App logo"
					/>
					<div style={{ display: "block", flexGrow: 1 }} />
					<SupportIconsBar sx={{ marginRight: 2 }} />
					{authenticationEnabled ? (
						<Divider
							orientation="vertical"
							flexItem
							variant="middle"
							sx={{ borderColor: "gray", marginRight: 1 }}
						/>
					) : null}
					{authenticationEnabled ? (
						<Button color="inherit" onClick={logout}>
							Logout
						</Button>
					) : null}
				</Toolbar>
			</AppBar>
		</Box>
	);
}

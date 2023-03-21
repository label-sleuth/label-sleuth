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

import { Link, Stack, Tooltip } from "@mui/material";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSlack, faGithub } from "@fortawesome/free-brands-svg-icons";
import { faBook } from "@fortawesome/free-solid-svg-icons";
import { SxProps } from "@mui/system";
import { SizeProp } from "@fortawesome/fontawesome-svg-core";

interface SupportIconsBarProps {
	sx?: SxProps;
	iconsSize?: SizeProp;
}

export const SupportIconsBar = ({
	sx,
	iconsSize = "xl",
}: SupportIconsBarProps) => {
	return (
		<Stack
			direction="row"
			alignItems="center"
			justifyContent="center"
			spacing={2}
			sx={{ ...sx }}
		>
			<Tooltip title={"Join Slack"} placement="top">
				<Link
					href="https://join.slack.com/t/labelsleuth/shared_invite/zt-1j5tpz1jl-W~UaNEKmK0RtzK~lI3Wkxg"
					target="_blank"
					rel="noopener noreferrer"
					color="inherit"
				>
					<FontAwesomeIcon size={iconsSize} icon={faSlack} />
				</Link>
			</Tooltip>
			<Tooltip title={"Github"} placement="top">
				<Link
					href="https://github.com/label-sleuth/label-sleuth"
					target="_blank"
					rel="noopener noreferrer"
					color="inherit"
				>
					<FontAwesomeIcon size={iconsSize} icon={faGithub} />
				</Link>
			</Tooltip>
			<Tooltip title={"Documentation"} placement="top">
				<Link
					href="https://www.label-sleuth.org/docs/index.html"
					target="_blank"
					rel="noopener noreferrer"
					color="inherit"
				>
					<FontAwesomeIcon size={iconsSize} icon={faBook} />
				</Link>
			</Tooltip>
		</Stack>
	);
};

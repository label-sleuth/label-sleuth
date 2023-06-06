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

import { Link, Stack, Tooltip} from "@mui/material";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSlack, faGithub } from "@fortawesome/free-brands-svg-icons";
import { faBook } from "@fortawesome/free-solid-svg-icons";
import { SxProps } from "@mui/system";
import { SizeProp } from "@fortawesome/fontawesome-svg-core";
import { useAppSelector } from "../customHooks/useRedux";
import { CustomizableUITextEnum } from "../const";

interface SupportIconsBarProps {
  sx?: SxProps;
	iconsSize?: SizeProp;
}

export const SupportIconsBar = ({ sx, iconsSize = "xl" }: SupportIconsBarProps) => {

  const customizableTexts = useAppSelector(state => state.customizableUIText.texts)

  return (
    <Stack direction="row" alignItems="center" justifyContent="center" spacing={2} sx={{ ...sx }}>
      <Tooltip title={customizableTexts[CustomizableUITextEnum.SLACK_LINK_TITLE]} placement="top">
        <Link
          href={customizableTexts[CustomizableUITextEnum.SLACK_LINK_URL]}
          target="_blank"
          rel="noopener noreferrer"
          color="inherit"
        >
          <FontAwesomeIcon size={iconsSize} icon={faSlack} />
        </Link>
      </Tooltip>
      <Tooltip title={customizableTexts[CustomizableUITextEnum.GITHUB_LINK_TITLE]} placement="top">
        <Link
          href={customizableTexts[CustomizableUITextEnum.GITHUB_LINK_URL]}
          target="_blank"
          rel="noopener noreferrer"
          color="inherit"
        >
          <FontAwesomeIcon size={iconsSize} icon={faGithub} />
        </Link>
      </Tooltip>
      <Tooltip title={customizableTexts[CustomizableUITextEnum.WEBPAGE_LINK_TITLE]} placement="top">
        <Link
          href={customizableTexts[CustomizableUITextEnum.WEBPAGE_LINK_URL]}
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

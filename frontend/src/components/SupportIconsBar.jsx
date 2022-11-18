import { Link } from "@mui/material";
import { Stack } from "@mui/material";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSlack, faGithub } from "@fortawesome/free-brands-svg-icons";
import { faBook } from "@fortawesome/free-solid-svg-icons";
import { Tooltip } from "@mui/material";

export const SupportIconsBar = ({ sx, iconsSize = "xl" }) => {
  return (
    <Stack direction="row" alignItems="center" justifyContent="center" spacing={2} sx={{ ...sx }}>
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

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

import Box from "@mui/material/Box";
import { Typography, CircularProgress, Stack } from "@mui/material";
import classes from "../index.module.css";
import { SidebarElement } from "../../../../components/element/SidebarElement";
import { styled } from "@mui/system";
import { Element } from "../../../../global";

interface HeaderProps {
  message: string;
}

export const Header = ({ message }: HeaderProps) => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        alignItem: "center",
        borderBottom: "1px solid #e2e2e2",
        pt: 3,
        pb: 3,
        justifyContent: "center",
        pl: 3,
      }}
    >
      <Typography style={{ height: "31px", lineHeight: "31px" }}>
        <strong>{message}</strong>
      </Typography>
    </Box>
  );
};

export const PanelTypography = styled(Typography)({
  display: "flex",
  justifyContent: "center",
  fontSize: "0.8rem",
  color: "rgba(0,0,0,.54)",
  paddingLeft: "15px",
  paddingRight: "15px",
  whiteSpace: "pre-line",
});

export const Loading = () => (
  <div
    style={{
      display: "flex",
      justifyContent: "center",
    }}
  >
    <CircularProgress />
  </div>
);

interface ElementListProps {
  elements: Element[];
  loading: boolean;
  emptyResultsMessage: string;
  nonEmptyResultsMessage: string | JSX.Element;
  children?: React.ReactElement;
  isPaginationRequired: boolean;
  elementsTopPadding?: number;
  Filters?: React.FC;
}

export const ElementList = ({
  elements,
  loading,
  emptyResultsMessage,
  nonEmptyResultsMessage,
  children,
  isPaginationRequired,
  elementsTopPadding = 0,
  Filters,
}: ElementListProps) => {
  return (
    <Stack
      sx={{
        display: "flex",
        justifyContent: "flex-start",
        direction: "column",
        mt: 1,
        height: isPaginationRequired ? "88vh" : "90.5vh",
        flexDirection: "column",
      }}
    >
      {elements === null ? (
        <PanelTypography>{""}</PanelTypography>
      ) : elements.length === 0 ? (
        <PanelTypography>{emptyResultsMessage}</PanelTypography>
      ) : (
        <PanelTypography>{nonEmptyResultsMessage}</PanelTypography>
      )}
      {Filters !== undefined && <Filters />}
      <Box
        className={`${isPaginationRequired ? classes.pagination_margin : ""}`}
        sx={{
          mt: elementsTopPadding ? elementsTopPadding : 1,
          display: "flex",
          flexDirection: "column",
          overflowY: loading ? "none" : "auto",
          mb: 5,
        }}
      >
        {loading ? (
          <Loading />
        ) : children ? (
          { ...children }
        ) : elements && elements.length > 0 ? (
          elements.map((element, i) => (
            <SidebarElement element={element} key={element.id} index={i} />
          ))
        ) : null}
      </Box>
    </Stack>
  );
};

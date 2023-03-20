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
import { Typography, CircularProgress } from "@mui/material";
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
        marginTop: "11px",
        borderBottom: "1px solid #e2e2e2",
        pb: "12px",
        justifyContent: "center",
      }}
    >
      <p style={{ width: "100%", textAlign: "center" }}>
        <strong>{message}</strong>
      </p>
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
  nonEmptyResultsMessage: string;
  children?: React.ReactElement;
  isPaginationRequired: boolean;
  elementsTopPadding?: number;
}

export const ElementList = ({
  elements,
  loading,
  emptyResultsMessage,
  nonEmptyResultsMessage,
  children,
  isPaginationRequired,
  elementsTopPadding = 0,
}: ElementListProps) => {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        mt: 1,
      }}
    >
      {elements === null ? (
        <PanelTypography>{""}</PanelTypography>
      ) : elements.length === 0 ? (
        <PanelTypography>{emptyResultsMessage}</PanelTypography>
      ) : (
        <PanelTypography>{nonEmptyResultsMessage}</PanelTypography>
      )}
      <Box
        className={`${classes["element-list"]} ${isPaginationRequired ? classes.pagination_margin : ""}`}
        sx={elementsTopPadding ? { mt: elementsTopPadding } : {}}
      >
        {loading ? (
          <Loading />
        ) : children ? (
          { ...children }
        ) : elements && elements.length > 0 ? (
          elements.map((element, i) => <SidebarElement element={element} key={element.id} index={i} />)
        ) : null}
      </Box>
    </Box>
  );
};

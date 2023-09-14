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

import { Pagination } from "@mui/material";
import { useMemo } from "react";
import { getPageCount } from "../../utils/utils";

interface CustomPaginationProps {
  currentPage: number,
  hitCount: number | null,
  sidebarPanelElementsPerPage: number,
  onPageChange: (event: any, value: number) => void, // find a better type than any
  isPaginationRequired: boolean,
  sx?: { [key:string]: string },
  size?: 'small' | 'medium' | 'large'
}

export const CustomPagination = ({
  currentPage,
  hitCount,
  sidebarPanelElementsPerPage,
  onPageChange,
  isPaginationRequired,
  sx,
  ...others
}: CustomPaginationProps) => {
  const pageCount = useMemo(() => {
    return getPageCount(sidebarPanelElementsPerPage, hitCount)
  }, [sidebarPanelElementsPerPage, hitCount])

  // if there aren't enough elements to complete a page, don't show pagination
  if (!isPaginationRequired) {
    return null;
  }
  return (
    <Pagination
      sx={{
        position: "absolute",
        bottom: "15px",
        textAlign: "center",
        display: "flex",
        justifyContent: "center",
        width: "100%",
        ...sx,
      }}
      count={pageCount}
      page={currentPage}
      onChange={onPageChange}
      siblingCount={1}
      color="primary"
      size="small"
      boundaryCount={1}
      {...others}
    />
  );
};

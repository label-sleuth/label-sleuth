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

import { useCallback } from "react";
import { ACTIONS_DRAWER_WIDTH, RIGHT_DRAWER_MIN_WIDTH, RIGHT_DRAWER_MAX_WIDTH } from "../../../const";

let isResizing = false;

const useResize = ({ setWidth }) => {
  
  const handleMouseMove = useCallback(
    (e) => {
      if (isResizing) {
        const offsetRight = document.body.offsetWidth - (e.clientX - document.body.offsetLeft);
        const newWidth = offsetRight - ACTIONS_DRAWER_WIDTH;
        if (newWidth > RIGHT_DRAWER_MIN_WIDTH && newWidth < RIGHT_DRAWER_MAX_WIDTH) {
          setWidth(newWidth);
        }
      }
    },
    [setWidth]
  );

  const handleMouseUp = useCallback(
    (e) => {
      if (!isResizing) {
        return;
      }
      isResizing = false;
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    },
    [handleMouseMove]
  );

  const handleMouseDown = useCallback(
    (e) => {
      e.stopPropagation();
      e.preventDefault();
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      isResizing = true;
    },
    [handleMouseUp, handleMouseMove]
  );

  return { handleMouseDown };
};

export default useResize;

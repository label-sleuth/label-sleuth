import { useCallback, useEffect, useState } from "react";
import { ACTIONS_DRAWER_WIDTH, RIGHT_DRAWER_MIN_WIDTH, RIGHT_DRAWER_MAX_WIDTH } from "../../../const";

let isResizing = false;

const useResize = ({ setWidth }) => {
  const handleMouseDown = useCallback((e) => {
    e.stopPropagation();
    e.preventDefault();
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    isResizing = true;
  }, []);

  const handleMouseUp = useCallback((e) => {
    if (!isResizing) {
      return;
    }
    isResizing = false;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (isResizing) {
      const offsetRight = document.body.offsetWidth - (e.clientX - document.body.offsetLeft);
      const newWidth = offsetRight - ACTIONS_DRAWER_WIDTH;
      if ((newWidth > RIGHT_DRAWER_MIN_WIDTH) &&  (newWidth < RIGHT_DRAWER_MAX_WIDTH)) {
        setWidth(newWidth);
      }
    }
  }, []);

  return { handleMouseDown };
};

export default useResize;

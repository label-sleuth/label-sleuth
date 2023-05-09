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

import React from "react";
import ReactDOM from "react-dom";

interface Coordinate {
  x: number;
  y: number;
}

interface ArrowConfig {
  hide?: boolean;
  direction?: "top" | "right" | "left" | "bottom";
  adjust?: Coordinate;
  componentId?: string;
  backupComponentId?: string;
  xEnd?: boolean;
  yEnd?: boolean;
  firstChild?: boolean;
}

const configs: ArrowConfig[] = [
  {
    hide: true,
  },
  {
    direction: "top",
    componentId: "upperbar-add-category",
    adjust: { x: 0, y: 15 },
  },
  {
    direction: "bottom",
    componentId: "main-element-view",
    xEnd: true,
    firstChild: true,
  },
  {
    hide: true,
    // direction: "right",
    // componentId: "sidebar-search-button",
    // adjust: { x: -140, y: -10}
  },
  {
    direction: "left",
    componentId: "model-version",
    backupComponentId: "model-version-unavailable",
    xEnd: true,
    adjust: { x: 30, y: 15 },
  },
  {
    hide: true,
    // direction: "right",
    // componentId: "sidebar-recommended-button",
    // adjust: { x: -140, y: -10}
  },
  {
    direction: "left",
    componentId: "workspace-tutorial-image",
    xEnd: true,
    adjust: { x: 70, y: -5 },
  },
];

interface ArrowProps {
  tutorialStageIndex: number;
}

const Arrow = ({ tutorialStageIndex }: ArrowProps) => {
  const [arrowPos, setArrowPos] = React.useState<{
    x: number;
    y: number;
  } | null>(null);

  const rotation = {
    top: "none",
    right: "rotate(90deg)",
    left: "rotate(-90deg)",
    bottom: "rotate(180deg)",
    none: "none",
  };

  const {
    direction,
    componentId,
    backupComponentId,
    xEnd,
    adjust,
    firstChild,
    hide,
  } = configs[tutorialStageIndex];

  React.useEffect(() => {
    let e = componentId ? document.getElementById(componentId) : null;
    if (!e)
      e = backupComponentId ? document.getElementById(backupComponentId) : null;
    if (!e) return;

    if (firstChild) {
      e = e.firstChild as HTMLElement;
    }

    if (e) {
      const boundingClientRect = e.getBoundingClientRect();
      let pos = {
        x: xEnd ? boundingClientRect.right - 75 : boundingClientRect.x,
        y: boundingClientRect.y,
      };
      switch (direction) {
        case "top":
          pos = { ...pos, y: pos.y + 75 };
          break;
        case "right":
          pos = { ...pos, x: pos.x - 75 };
          break;
        case "bottom":
          pos = { ...pos, y: pos.y - 75 };
          break;
        case "left":
          pos = { ...pos, x: pos.x + 75 };
          break;
      }
      if (adjust) {
        pos = {
          x: pos.x + adjust.x,
          y: pos.y + adjust.y,
        };
      }
      setArrowPos(pos);
    }
  }, [tutorialStageIndex]);

  return !hide
    ? ReactDOM.createPortal(
        <div
          style={{
            width: 0,
            height: 0,
            borderLeft: "30px solid transparent",
            borderRight: "30px solid transparent",
            borderBottom: "60px solid blue",
            position: "fixed",
            transform: direction !== undefined ? rotation[direction] : rotation.top,
            zIndex: 10100,
            top: arrowPos ? arrowPos.y : 400,
            left: arrowPos ? arrowPos.x : 400,
          }}
        />,
        document.getElementById("root") as HTMLElement // we are sure it exists
      )
    : null;
};

export default Arrow;
export { configs };

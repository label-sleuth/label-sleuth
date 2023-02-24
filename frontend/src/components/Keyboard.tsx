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


interface KeyboardProps {
  kbd: string;
  style?: {[key: string]: string}
}

/**
 * A styled kbd component to display shortcuts keyboard keys
 * @param {String} kbd: The text to display, i.g. "Shift"
 */
export const Keyboard = ({ kbd, style = {} }: KeyboardProps) => {
  return (
    <kbd
      style={{
        backgroundColor: "#eee",
        borderRadius: "3px",
        border: "1px solid #b4b4b4",
        boxShadow: "0 1px 1px rgba(0, 0, 0, .2), 0 2px 0 0 rgba(255, 255, 255, .7) inset",
        color: "#333",
        display: "inline-block",
        fontSize: ".85em",
        fontWeight: 700,
        lineHeight: 1,
        padding: "2px 4px",
        whiteSpace: "nowrap",
        ...style
      }}
    >
      {kbd}
    </kbd>
  );
};

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
import { screen } from "@testing-library/react";
import { renderWithProviderAndRouter } from "../../../utils/test-utils";
import { initialState as initialWorkspaceState } from "../DataSlice";
import WorkspaceInfo from "../information/WorkspaceInfo";

test("test that workspace information is displayed correctly", async () => {
  renderWithProviderAndRouter(
    <WorkspaceInfo workspaceId={"workspace_id"} setTutorialOpen={false} />,
    {
      preloadedState: {
        workspace: {
          ...initialWorkspaceState,
          curCategory: "cat1",
          model_version: 4,
          workspaceId: "workspace_id",
        },
      },
    }
  );

  expect(screen.getByText(/workspace_id/i)).toBeInTheDocument();
  expect(screen.queryByRole('tabpanel')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Download data/i})).toBeInTheDocument();
  // TODO: add checking if username is present when authentication is enabled
});

test("test that model version is updated if model changes", async () => {
  renderWithProviderAndRouter(
    <WorkspaceInfo workspaceId={"workspace_id"} setTutorialOpen={false} checkModelInterval={1000} />,
    {
      preloadedState: {
        workspace: {
          ...initialWorkspaceState,
          curCategory: 0,
          model_version: 4,
          workspaceId: "workspace_id",
        },
        authenticate: {
          token: "token"
        }
      },
    }
  );

  expect(screen.getByText(/4/i)).toBeInTheDocument();
  expect(screen.getByText("th", { exact: true })).toBeInTheDocument();

  expect(
    await screen.findByText(/5/i, {}, { timeout: "2000" })
  ).toBeInTheDocument();
 });

test("test that model related information is not displayed if there is no category selected", async () => {
  renderWithProviderAndRouter(
    <WorkspaceInfo workspaceId={"workspace_id"} setTutorialOpen={false} />,
    {
      preloadedState: {
        workspace: {
          ...initialWorkspaceState,
          curCategory: null,
          model_version: 4,
          workspaceId: "workspace_id",
        },
      },
    }
  );

  expect(screen.queryByText(/Current model/i)).not.toBeInTheDocument();

  expect(screen.queryByRole('tabpanel')).not.toBeInTheDocument();
});

test("test model version ordinal: st", async () => {
  renderWithProviderAndRouter(
    <WorkspaceInfo workspaceId={"workspace_id"} setTutorialOpen={false} />,
    {
      preloadedState: {
        workspace: {
          ...initialWorkspaceState,
          curCategory: 0,
          model_version: 1,
          workspaceId: "workspace_id",
        },
      },
    }
  );
  expect(screen.getByText("st", { exact: true })).toBeInTheDocument();
});

test("test model version ordinal: nd", async () => {
  renderWithProviderAndRouter(
    <WorkspaceInfo workspaceId={"workspace_id"} setTutorialOpen={false} />,
    {
      preloadedState: {
        workspace: {
          ...initialWorkspaceState,
          curCategory: 0,
          model_version: 102,
        },
      },
    }
  );
  expect(screen.getByText("nd", { exact: true })).toBeInTheDocument();
});

test("test model version ordinal: rd", async () => {
  renderWithProviderAndRouter(
    <WorkspaceInfo workspaceId={"workspace_id"} setTutorialOpen={false} />,
    {
      preloadedState: {
        workspace: {
          ...initialWorkspaceState,
          curCategory: 0,
          model_version: 1123,
        },
      },
    }
  );
  expect(screen.getByText("rd", { exact: true })).toBeInTheDocument();
});

test("test model version ordinal: th", async () => {
  renderWithProviderAndRouter(
    <WorkspaceInfo workspaceId={"workspace_id"} setTutorialOpen={false} />,
    {
      preloadedState: {
        workspace: {
          ...initialWorkspaceState,
          curCategory: 0,
          model_version: 12,
        },
      },
    }
  );
  expect(screen.getByText("th", { exact: true })).toBeInTheDocument();
});
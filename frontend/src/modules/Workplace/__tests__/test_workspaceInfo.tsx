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

import { screen } from "@testing-library/react";
import { renderWithProviderAndRouter } from "../../../utils/test-utils";
import { initialState as initialWorkspaceState } from "../redux";
import { WorkspaceInfo } from "../information";

test("workspace information is displayed correctly", async () => {
  renderWithProviderAndRouter(<WorkspaceInfo shouldFireConfetti={false} />, {
    preloadedState: {
      workspace: {
        ...initialWorkspaceState,
        curCategory: "cat1",
        modelVersion: 4,
        workspaceId: "workspace_id",
      },
    },
  });

  expect(screen.getByText(/workspace_id/i)).toBeInTheDocument();
  expect(screen.getByRole("tabpanel")).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Download", exact: true })
  ).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /upload/i })).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: /download model/i, exact: true })
  ).toBeInTheDocument();
  // TODO: add checking if username is present when authentication is enabled
});

test("model version is updated if model changes", async () => {
  renderWithProviderAndRouter(
    <WorkspaceInfo checkModelInterval={1000} shouldFireConfetti={false} />,
    {
      preloadedState: {
        workspace: {
          ...initialWorkspaceState,
          curCategory: 0,
          modelVersion: 4,
          workspaceId: "workspace_id",
          nextModelShouldBeTraining: true,
        },
        authenticate: {
          token: "token",
        },
      },
    }
  );

  expect(screen.getByText(/4/i)).toBeInTheDocument();
  expect(screen.getByText("th", { exact: true })).toBeInTheDocument();

  expect(
    await screen.findByText(/5/i, {}, { timeout: 2000 })
  ).toBeInTheDocument();
});

test("model related information is not displayed if there is no category selected", async () => {
  renderWithProviderAndRouter(<WorkspaceInfo shouldFireConfetti={false} />, {
    preloadedState: {
      workspace: {
        ...initialWorkspaceState,
        curCategory: null,
        modelVersion: 4,
        workspaceId: "workspace_id",
      },
    },
  });

  expect(screen.queryByText(/Current model/i)).not.toBeInTheDocument();

  expect(screen.queryByRole("tabpanel")).not.toBeInTheDocument();
});

test("model version ordinal: st", async () => {
  renderWithProviderAndRouter(<WorkspaceInfo shouldFireConfetti={false} />, {
    preloadedState: {
      workspace: {
        ...initialWorkspaceState,
        curCategory: 0,
        modelVersion: 1,
        workspaceId: "workspace_id",
      },
    },
  });
  expect(screen.getByText("st", { exact: true })).toBeInTheDocument();
});

test("model version ordinal: nd", async () => {
  renderWithProviderAndRouter(<WorkspaceInfo shouldFireConfetti={false} />, {
    preloadedState: {
      workspace: {
        ...initialWorkspaceState,
        curCategory: 0,
        modelVersion: 102,
      },
    },
  });
  expect(screen.getByText("nd", { exact: true })).toBeInTheDocument();
});

test("model version ordinal: rd", async () => {
  renderWithProviderAndRouter(<WorkspaceInfo shouldFireConfetti={false} />, {
    preloadedState: {
      workspace: {
        ...initialWorkspaceState,
        curCategory: 0,
        modelVersion: 1123,
      },
    },
  });
  expect(screen.getByText("rd", { exact: true })).toBeInTheDocument();
});

test("model version ordinal: th", async () => {
  renderWithProviderAndRouter(<WorkspaceInfo shouldFireConfetti={false} />, {
    preloadedState: {
      workspace: {
        ...initialWorkspaceState,
        curCategory: 0,
        modelVersion: 12,
      },
    },
  });
  expect(screen.getByText("th", { exact: true })).toBeInTheDocument();
});

test("model error is shown if model creation failed", async () => {
  renderWithProviderAndRouter(<WorkspaceInfo shouldFireConfetti={false} />, {
    preloadedState: {
      workspace: {
        ...initialWorkspaceState,
        curCategory: 0,
        modelVersion: 12,
        lastModelFailed: true,
      },
    },
  });
  expect(await screen.findByRole("alert")).toBeInTheDocument();
  expect(await screen.findByText(/Model creation failed/i)).toBeInTheDocument();
});

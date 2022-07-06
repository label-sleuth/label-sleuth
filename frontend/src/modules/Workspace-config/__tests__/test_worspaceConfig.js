
import React from "react";
import { screen } from "@testing-library/react";
import { renderWithProviderAndRouter } from "../../../utils/test-utils";
import WorkspaceConfig from '../index';

test("test that workspace information is displayed correctly", async () => {
    renderWithProviderAndRouter(
      <WorkspaceConfig/>
    )
    expect(screen.getByText(/Continue with Existing Workspace/i)).toBeInTheDocument()
  });
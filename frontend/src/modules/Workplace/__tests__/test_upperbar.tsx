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

import { screen, fireEvent } from "@testing-library/react";
import {
  createCategoryAndTest,
  renderWithProviderAndRouter,
} from "../../../utils/test-utils";
import { initialState as initialWorkspaceState } from "../redux";
import { UpperBar } from "../upperbar";
import { categoriesExample } from "../../../utils/test-utils";
import {
  CATEGORY_NAME_MAX_CHARS,
  RIGHT_DRAWER_INITIAL_WIDTH,
} from "../../../const";

test("category action butttons are present", async () => {
  renderWithProviderAndRouter(
    <UpperBar
      rightDrawerWidth={RIGHT_DRAWER_INITIAL_WIDTH}
      rightPanelOpen={true}
    />,
    {
      preloadedState: {
        workspace: {
          ...initialWorkspaceState,
          curCategory: categoriesExample.categories[0].category_id,
          categories: categoriesExample.categories,
        },
      },
    }
  );

  expect(screen.getByRole("button", { name: /create/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /delete/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /edit/i })).toBeInTheDocument();
});

test("delete and edit category buttons are not present if no category is selected", async () => {
  renderWithProviderAndRouter(
    <UpperBar
      rightDrawerWidth={RIGHT_DRAWER_INITIAL_WIDTH}
      rightPanelOpen={true}
    />,
    {
      preloadedState: {
        workspace: {
          ...initialWorkspaceState,
          curCategory: null,
          categories: categoriesExample.categories,
        },
      },
    }
  );

  expect(
    screen.queryByRole("button", { name: /delete/i })
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: /edit/i })
  ).not.toBeInTheDocument();
});

test("create new category validation", async () => {
  renderWithProviderAndRouter(
    <UpperBar
      rightDrawerWidth={RIGHT_DRAWER_INITIAL_WIDTH}
      rightPanelOpen={true}
    />,
    {
      preloadedState: {
        workspace: {
          ...initialWorkspaceState,
          curCategory: categoriesExample.categories[0].category_id,
          categories: categoriesExample.categories,
          workspaceId: "workspace_id",
        },
      },
    }
  );

  fireEvent.click(screen.getByRole("button", { name: /create/i }));
  expect(screen.getByText(/Create a new category/i)).toBeInTheDocument();

  const button = screen.getByRole("button", { name: "Create" });
  const input = screen.getByRole("textbox", { name: "New category name" });

  expect(button).toBeDisabled();

  fireEvent.change(input, {
    target: {
      value:
        "This text is longer than 100 characters which is the maximum len allowed and this text is very long and have more than 100 characters so we should get this error",
    },
  });
  expect(
    screen.getByText(
      `Name may be max ${CATEGORY_NAME_MAX_CHARS} characters long`
    )
  ).toBeInTheDocument();
  expect(button).toBeDisabled();
});

test("create new category flow", async () => {
  renderWithProviderAndRouter(
    <UpperBar
      rightDrawerWidth={RIGHT_DRAWER_INITIAL_WIDTH}
      rightPanelOpen={true}
    />,
    {
      preloadedState: {
        workspace: {
          ...initialWorkspaceState,
          curCategory: categoriesExample.categories[0].category_id,
          categories: categoriesExample.categories,
          workspaceId: "workspace_id",
        },
      },
    }
  );

  await createCategoryAndTest();

  // commenting following line out because I don't know how to differenciate to toast when getting them by role
  // accesible name or description is not the toast message
  // expect(await screen.findByRole("alert", {description: /has been created/i})).toBeInTheDocument()

  // check that modal is no longer present
  expect(screen.queryByText(/Create a new category/i)).not.toBeVisible();

  // check that the created category is selected in the dropdown
  expect(screen.getByLabelText("test_category")).toBeInTheDocument();
});

test("delete category flow", async () => {
  renderWithProviderAndRouter(
    <UpperBar
      rightDrawerWidth={RIGHT_DRAWER_INITIAL_WIDTH}
      rightPanelOpen={true}
    />,
    {
      preloadedState: {
        workspace: {
          ...initialWorkspaceState,
          curCategory: null,
          categories: categoriesExample.categories,
          workspaceId: "workspace_id",
        },
      },
    }
  );

  await createCategoryAndTest();

  //const buttonDelete = screen.getByRole('button', {name: /delete/i})
  const buttonDelete = screen.getByLabelText(/delete/i);
  const buttonEdit = screen.queryByRole("button", { name: "Edit" });

  fireEvent.click(buttonDelete);
  expect(
    screen.getByText(/Are you sure you want to delete the category?/i)
  ).toBeInTheDocument();
  const buttonYes = screen.getByRole("button", { name: "Yes" });
  fireEvent.click(buttonYes);

  expect(
    await screen.findByText(/The category test_category has been deleted/)
  ).toBeInTheDocument();
  expect(
    screen.queryByText(/Are you sure you want to delete the category 'ad'?/i)
  ).not.toBeInTheDocument();
  expect(buttonDelete).not.toBeInTheDocument();
  expect(buttonEdit).not.toBeInTheDocument();

  // TODO: check that the category is not present in the dropdown and that no category is selected
});

test("edit category flow", async () => {
  renderWithProviderAndRouter(
    <UpperBar
      rightDrawerWidth={RIGHT_DRAWER_INITIAL_WIDTH}
      rightPanelOpen={true}
    />,
    {
      preloadedState: {
        workspace: {
          ...initialWorkspaceState,
          curCategory: null,
          categories: categoriesExample.categories,
          workspaceId: "workspace_id",
        },
      },
    }
  );

  await createCategoryAndTest();

  fireEvent.click(await screen.findByRole("button", { name: /edit/i }));
  expect(
    screen.getByRole("heading", { name: /Edit category/i })
  ).toBeInTheDocument();

  const button = screen.getByRole("button", { name: "Edit" });
  const input : HTMLInputElement = screen.getByRole("textbox", { name: "New category name" });
  fireEvent.change(input, { target: { value: " edited_test_category " } });
  expect(input.value).toBe(" edited_test_category ");
  expect(button).not.toBeDisabled();

  fireEvent.click(button);
  expect(
    await screen.findByText(/The category name has been successfully edited/i)
  ).toBeInTheDocument();

  expect(
    await screen.findByRole("button", { name: "edited_test_category" })
  ).toBeInTheDocument();
});

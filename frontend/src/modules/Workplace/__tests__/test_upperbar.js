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
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviderAndRouter, createCategory } from "../../../utils/test-utils";
import { initialState as initialWorkspaceState } from "../redux/DataSlice";
import UpperBar from '../upperbar/UpperBar'
import { categoriesExample } from '../../../utils/test-utils'

test("test that category action butttons are present", async () => {
    renderWithProviderAndRouter(
      <UpperBar />,
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
  
    expect(screen.queryByRole('button', { name: /create/i})).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /delete/i})).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /edit/i})).toBeInTheDocument();
});

test("test that delete and edit category buttons are not present if no category is selected", async () => {
  renderWithProviderAndRouter(
    <UpperBar />,
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

  expect(screen.queryByRole('button', { name: /delete/i})).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /edit/i})).not.toBeInTheDocument();
});



test("test create new category validation", async () => {
  renderWithProviderAndRouter(
    <UpperBar />,
    {
      preloadedState: {
        workspace: {
          ...initialWorkspaceState,
          curCategory: categoriesExample.categories[0].category_id,
          categories: categoriesExample.categories,
          workspaceId: "workspace_id"
        },
      },
    }
  );

  fireEvent.click(screen.queryByRole('button', { name: /create/i}))
  expect(screen.getByText(/Create a new category/i)).toBeInTheDocument();

  const button = screen.getByRole('button', {name: "Create"})
  const input = screen.getByRole('textbox', {name: "New category name"})
  
  expect(button).toBeDisabled()
  
  fireEvent.change(input, {target: {value: "!"}})
  expect(screen.getByText(/Name may only contain English characters, digits, underscores and spaces/i)).toBeInTheDocument()
  expect(button).toBeDisabled()

  fireEvent.change(input, {target: {value: "This text is longer than 30 characters which is the maximum len allowed"}})
  expect(screen.getByText(/Name may be max 30 characters long/i)).toBeInTheDocument()
  expect(button).toBeDisabled()
});

test("test create new category flow", async () => {
  renderWithProviderAndRouter(
    <UpperBar />,
    {
      preloadedState: {
        workspace: {
          ...initialWorkspaceState,
          curCategory: categoriesExample.categories[0].category_id,
          categories: categoriesExample.categories,
          workspaceId: "workspace_id"
        },
      },
    }
  );

  await createCategory()

  // commenting following line out because I don't know how to differenciate to toast when getting them by role
  // accesible name or description is not the toast message
  // expect(await screen.findByRole("alert", {description: /has been created/i})).toBeInTheDocument()
  expect(await screen.findByText(/The category 'test_category' has been created/)).toBeInTheDocument()
  
  // check that modal is no longer present
  expect(screen.queryByText(/Create a new category/i)).not.toBeInTheDocument();

  // check that the created category is selected in the dropdown
  expect(screen.getByLabelText("test_category")).toBeInTheDocument()
});

test("test delete category flow", async () => {
  const r = renderWithProviderAndRouter(
    <UpperBar />,
    {
      preloadedState: {
        workspace: {
          ...initialWorkspaceState,
          curCategory: null,
          categories: categoriesExample.categories,
          workspaceId: "workspace_id"
        },
      },
    }
  );
  
  await createCategory()

  fireEvent.click(screen.queryByRole('button', { name: /delete/i}))
  expect(screen.getByText(/Are you sure you want to delete the category?/i)).toBeInTheDocument();
  const button = screen.getByRole('button', {name: "Yes"})
  fireEvent.click(button)
  
  expect(await screen.findByText(/The category test_category has been deleted/)).toBeInTheDocument()
  expect(screen.queryByText(/Are you sure you want to delete the category 'ad'?/i)).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /delete/i}));
  expect(screen.queryByRole('button', { name: /edit/i})).not.toBeInTheDocument();

  await createCategory()
  // TODO: check that the category is not present in the dropdown and that no category is selected
});

test("test edit category flow", async () => {
  const r = renderWithProviderAndRouter(
    <UpperBar />,
    {
      preloadedState: {
        workspace: {
          ...initialWorkspaceState,
          curCategory: null,
          categories: categoriesExample.categories,
          workspaceId: "workspace_id"
        },
      },
    }
  );
  
  await createCategory()

  fireEvent.click(await screen.findByRole('button', { name: /edit/i}))
  expect(screen.getByRole("heading", /Edit category/i)).toBeInTheDocument();

  const button = screen.getByRole('button', {name: "Edit"})
  const input = screen.getByRole('textbox', {name: "New category name"})
  fireEvent.change(input, {target: {value: " edited_test_category "}})
  expect(input.value).toBe(' edited_test_category ')
  expect(button).not.toBeDisabled()

  fireEvent.click(button)
  expect(await screen.findByText(/The category name has been successfully edited/i)).toBeInTheDocument()

  expect(await screen.findByRole('button', {name: "edited_test_category"})).toBeInTheDocument()
});
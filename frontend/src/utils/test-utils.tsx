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

import { render, screen, fireEvent } from "@testing-library/react";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { setupStore } from "../store/configureStore";
import { ToastContainer } from "react-toastify";
import { ReactElement, ReactNode } from "react";

export const renderWithProviderAndRouter = (
  ui: JSX.Element,
  {
    preloadedState = {},
    store = setupStore(preloadedState),
    ...renderOptions
  } = {}
) => {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <Provider store={store}>
        <BrowserRouter>
          <ToastContainer
            position="top-center"
            hideProgressBar={true}
            autoClose={7000}
            theme="dark"
          />
          {children}
        </BrowserRouter>
      </Provider>
    );
  }

  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
};

export const createCategoryAndTest = async () => {
  const createCategoryButton = await screen.findByRole("button", {
    name: /create/i,
  });
  fireEvent.click(createCategoryButton);
  expect(await screen.findByText(/Create new category/i)).toBeInTheDocument();
  const button = screen.getByRole("button", { name: "Create" });
  const input: HTMLInputElement = screen.getByRole("textbox", {
    name: "Category name",
  });
  const newCategoryName = " test_category";
  fireEvent.change(input, { target: { value: newCategoryName } });
  expect(input.value).toBe(newCategoryName);
  expect(button).not.toBeDisabled();
  fireEvent.click(button);

  expect(
    await screen.findByText(/The category 'test_category' has been created/)
  ).toBeInTheDocument();
  expect(screen.queryByText(/Create new category/i)).not.toBeVisible();
};

export const modelUpdateExample = {
  iterations: [
    {
      iteration_status: "READY",
      iteration: 4,
      model_status: "READY",
    },
  ],
};

export const workspacesExample = {
  workspaces: ["full", "medium", "small"],
};

export const datasetsExample = {
  datasets: [
    { dataset_id: "full" },
    { dataset_id: "medium" },
    { dataset_id: "small" },
    { dataset_id: "very_small" },
  ],
};

export const categoriesExample = {
  categories: [
    { category_description: "", category_id: 22, category_name: "cat1" },
    { category_description: "", category_id: 23, category_name: "cat2" },
    { category_description: "", category_id: 24, category_name: "cat3" },
  ],
};

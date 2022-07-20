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

import "@testing-library/jest-dom";
import { rest } from "msw";
import { setupServer } from "msw/node";
import {
  modelUpdateExample,
  workspacesExample,
  datasetsExample,
  categoriesExample,
} from "./utils/test-utils";

jest.setTimeout(10000);

const handlers = [
  rest.get("/workspace/:workspace_id/models", (req, res, ctx) => {
    const models = modelUpdateExample;
    return res(ctx.json(models));
  }),
  rest.get(`/workspaces`, (req, res, ctx) => {
    return res(ctx.json(workspacesExample));
  }),
  rest.get(`/datasets`, (req, res, ctx) => {
    return res(ctx.json(datasetsExample));
  }),
  rest.get(`/workspace/:workspace_id/categories`, (req, res, ctx) => {
    return res(
      ctx.json([
        ...categoriesExample,
        {
          category_description: "",
          category_id: 26,
          category_name: "test_category",
        },
      ])
    );
  }),
  rest.post("/workspace/:workspace_id/category", (req, res, ctx) => {
    const category = req.body;
    return res(
      ctx.json({
        category_description: "",
        category_id: "26",
        category_name: category.category_name,
        update_counter: true,
      })
    );
  }),
];

const server = setupServer(...handlers);

beforeAll(() => server.listen());

afterEach(() => server.resetHandlers());

afterAll(() => server.close());

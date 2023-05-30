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
  rest.get("/workspace/:workspace_id/iterations", (req, res, ctx) => {
    const iterations = modelUpdateExample;
    return res(ctx.delay(), ctx.json(iterations));
  }),
  rest.get(`/workspaces`, (req, res, ctx) => {
    return res(ctx.delay(), ctx.json(workspacesExample));
  }),
  rest.get(`/datasets`, (req, res, ctx) => {
    return res(ctx.delay(), ctx.json(datasetsExample));
  }),
  rest.get(`/workspace/:workspace_id/categories`, (req, res, ctx) => {
    return res(
      ctx.delay(),
      ctx.json([
        ...categoriesExample.categories,
        {
          category_description: "",
          category_id: 26,
          category_name: "test_category",
        },
      ])
    );
  }),
  rest.post("/workspace/:workspace_id/category", (req, res, ctx) => {
    const category = req.body as Record<string, any>;
    return res(
      ctx.delay(),
      ctx.json({
        category_description: "",
        category_id: "26",
        category_name: category?.category_name,
        update_counter: true,
      })
    );
  }),
  rest.delete(
    "/workspace/:workspace_id/category/:category_id",
    (req, res, ctx) => {
      return res(
        ctx.delay(),
        ctx.json({
          category_id: "26",
          workspace_id: "workspace_id",
        })
      );
    }
  ),
  rest.put(
    "/workspace/:workspace_id/category/:category_id",
    (req, res, ctx) => {
      const { category_name, category_description } = req.body as Record<
        string,
        any
      >;
      return res(
        ctx.delay(),
        ctx.json({
          category_id: "26",
          category_description,
          category_name,
          workspace_id: "workspace_id",
        })
      );
    }
  ),
  rest.get("/version", (_, res, ctx) => {
    return res(ctx.delay(), ctx.json({ source: "git", version: "v0.11.7" }));
  }),
];

const server = setupServer(...handlers);

beforeAll(() => {
  server.listen();
});

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.setItem("workspaceId", JSON.stringify("workspace_id"));
})

afterEach(() => server.resetHandlers());

afterAll(() => {
  server.close();
});

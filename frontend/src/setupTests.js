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

// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";
import { rest } from "msw";
import { setupServer } from "msw/node";
import {
  modelUpdateExample,
  workspacesExample,
  datasetsExample,
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
];

const server = setupServer(...handlers);

beforeAll(() => server.listen());

afterEach(() => server.resetHandlers());

afterAll(() => server.close());

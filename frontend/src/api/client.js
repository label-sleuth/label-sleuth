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

export const client = async (
  endpoint,
  { body, method, headers, stringifyBody=true, parseResponseBodyAs="json",  ...customConfig } = {}
) => {
  let customHeaders = {
    "Content-Type": "application/json",
    ...headers,
  };
  if (localStorage.token) {
    customHeaders["Authorization"] = `Bearer ${localStorage.token}`;
  }

  const config = {
    ...customConfig,
    ...customHeaders,
    method,
  };

  if (body) {
    config.body = stringifyBody ? JSON.stringify(body) : body;
  }

  return await fetch(endpoint, config).then(async (response) => {
    if (response.ok) {
      let data
      if (parseResponseBodyAs === "json") {
        data = await response.json();
      }
      else if (parseResponseBodyAs === "text") {
        data = await response.text();
      }
      else {
        throw new Error("parseResponseBodyAs should be 'json' or 'text'")
      }
      return ({
        status: response.status,
        data,
        headers: response.headers,
        url: response.url,
      });
    } else {
      const text = await response.text();
      throw new Error(text);
    }
  });
};

client.get = (endpoint, customConfig = {}) => {
  return client(endpoint, { ...customConfig, method: "GET" });
};

client.post = (endpoint, body, customConfig = {}) => {
  return client(endpoint, { ...customConfig, method: "POST", body });
};

client.delete = (endpoint, body, customConfig = {}) => {
  return client(endpoint, { ...customConfig, method: "DELETE", body });
};

client.put = (endpoint, body, customConfig = {}) => {
  return client(endpoint, { ...customConfig, method: "PUT", body });
};

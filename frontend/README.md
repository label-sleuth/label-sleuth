# Label sleuth frontend

The frontend of Label sleuth is implemented using React. [Redux](https://react-redux.js.org/) is used to manage the state of the application and [mui](https://mui.com/) is the components library. 

## Requirements

To run the frontend you need to have intalled NodeJS (version 16.16 or higher) installed. Check [this page](https://nodejs.org/en/download/) to install NodeJS.

## Local development

Below are instructions to run this website in your local environment.

### Step 1

Clone the repo to your local directory:
`git clone https://github.com/label-sleuth/label-sleuth.git`

### Step 2

Go to the frontend folder:
`cd frontend`

### Step 3

Install the dependencies:
`npm install`

### Step 4

Under the cloned directory, run the app in the development mode:
`npm run start`

### Step 5

Run the backend by following the [installation guide](https://www.label-sleuth.org/docs/installation.html).

_By default the React App will be served at `localhost:3000`. The compiled react app located at `/label_sleuth/build` will be statically served by the backend at `localhost:8000`._

## Build the application

### Step 1

Prepare a production ready application by running `npm run build`. This will create a `/build` folder.

### Step 2

Copy the `/build` folder inside the `/label_sleuth` folder. This is where the backend expects the compiled frontend files to be in order to serve them.

_Note: The default `/build` folder inside `/label_sleuth` is always in sync with the main branch an it is automatically updated anytime frontend changes are detected in the main branch. Thus, there is **no need** to change and push the build files in your commits._

## Architecture

- The project is structured in modules. Each of the modules correspond to a page where the user can be routed to. There are three modules:
  - Workspace-config
  - Workplace, and
  - Login
  
  Each module has its own redux slice, with its state, actions, action thunks and reducers. In addition, the Workplace module has several sub-slices because its state is bigger and complex than the ones of the other modules. 
  
- Functional components are used instead of class components. Component's logic that uses hooks is modularized using custom hooks.
- Common components are placed inside the [components folder](https://github.com/label-sleuth/label-sleuth/tree/main/frontend/src/components).
- All the labels found in the UI such us titles and tooltip messages are stored in the [const.js](https://github.com/label-sleuth/label-sleuth/blob/main/frontend/src/const.js) file.


## Error handling

Endpoint calls to the backend API who's response status isn't OK are handled in a centralized way. All the interactions with the API happen through the API client that is in charge of making all the endpoint calls using the `fetch` library. At the same time, all API client usages happen inside [Redux thunks](https://redux.js.org/usage/writing-logic-thunks).  

The error pipeline is as follows:

1. A thunk action is dispatched in a React component.
2. The thunk is executed and calls the API client.
3. The API client calls the `fetch` library.
4. The response of the call returns a non OK code and the API client throws an error.
5. The action thunk resolves into a `Rejected` redux action.
6. The custom redux error middleware receives the action and `isRejected()` is `true`.  
7. `getErrorMessage()`is used to parse the error and get its message. The backend populates the `error.message` field.
8. An action is dispatched to update `state.error.errorMessage`.
9. The `useEffect` inside `useErrorHandler()` is executed because of the state change and a toast notification is displayed. 
10. The error state is cleaned.

## Test

Tests can be run executing `npm run test`. Testing is done using the [react-testing-library](https://testing-library.com/docs/dom-testing-library/intro/) with [Jest](https://jestjs.io/) as the test-runner. Tests can be found under the `/__test__` folder of each module. [setupTests.js](https://github.com/label-sleuth/label-sleuth/blob/main/frontend/src/setupTests.js) prepares the API calls to the backend by using [msw](https://mswjs.io/).

## Environment variables

Different environment variables can be configured. They are:

- `REACT_APP_API_URL`: the URL used to make API requests to the backend.
- `REACT_APP_AUTH_ENABLED`: feature flag that enables or disabled the login page and the need for an authorization token to be set. IMPORTANT: this is now set using the backend's `login_required` feature flag thanks to the feature flag management described in [this issue](https://github.com/label-sleuth/label-sleuth/issues/217).

_Note: the environment variables defined in the `.env` files must start with `REACT_APP_`, eg. `REACT_APP_MY_ENV_VALUE`._

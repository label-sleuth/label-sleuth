# Label sleuth frontend

The frontend of Label sleuth is implemented using React. [Redux](https://react-redux.js.org/) is used to manage the state of the application and [mui](https://mui.com/) is the components library. A typescript migration from javascript to typescript is currently being performed.

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
- All the labels found in the UI such us titles and tooltip messages are stored in the [const.ts](https://github.com/label-sleuth/label-sleuth/blob/main/frontend/src/const.js) file.


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

## Feature flags

Before the user can start the system's UI, the feature flags are fetched (see [here](https://github.com/label-sleuth/label-sleuth/blob/3d2cf586204b60b5fea861eed50a9f642264cd1e/frontend/src/App.tsx#L97)). Currently,
the feature flags that are used are: `authenticationEnabled`, `mainPanelElementsPerPage` and `sidebarPanelElementsPerPage`.


## Typescript migration notes

Here are some notes if you are contributing to the typescript migration effort:
- Rename files from `js` to `ts` if they don't containg react component's, and `jsx` to `tsx` otherwise.
- When using the Redux state from a react component, use the custom hooks `useAppSelector` and `useAppDispatch` instead of `useSelector` and `useDispatch`. This allows to access the Redux state types.
- Types are defined in `global.d.ts`, expect for the ones in the following item.
- When typing a React component props, create an interface above the component's definition with the name `[Component]Props`.
- If using vscode, make sure that the linter you are using uses the same version you have installed in the `node_modules` folder (currently `4.8.*`). See [this stackoverflow question](https://stackoverflow.com/questions/39668731/what-typescript-version-is-visual-studio-code-using-how-to-update-it) for more info.
  
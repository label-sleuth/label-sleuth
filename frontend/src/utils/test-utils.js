import React from 'react'
import { render } from '@testing-library/react'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import setupStore from '../store/configureStore'

export const renderWithProviderAndRouter = (
  ui,
  {
    preloadedState = {},
    store = setupStore(preloadedState),
    ...renderOptions
  } = {}
) => {
  function Wrapper({ children }) {
    return <Provider store={store}> <BrowserRouter>{children}</BrowserRouter></Provider>
  }

  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) }
}

export const modelUpdateExample = {
  models: [
    {
      active_learning_status: "READY",
      iteration: 4,
      model_status: "READY",
    },
  ],
};

export const workspacesExample = {
  workspaces: [
    "full",
    "medium",
    "small",
  ],
}

export const datasetsExample = {
  datasets: [
    { dataset_id: "full" },
    { dataset_id: "medium" },
    { dataset_id: "small" },
    { dataset_id: "very_small" },
  ],
}
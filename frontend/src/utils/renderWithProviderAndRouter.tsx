import { render } from "@testing-library/react";
import { ReactElement, ReactNode } from "react";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { setupStore } from "../store/configureStore";

export const renderWithProviderAndRouter = (
  ui: ReactElement,
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

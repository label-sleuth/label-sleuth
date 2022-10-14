/**
 * Get the error message from the error object.
 * @param {the error returned by the redux thunk} err
 * @returns the error message
 */
export const getErrorMessage = (err) => {
  const defaultErrorMessage = "Something went wrong";
  let errorMessage;
  if (err.message) {
    try {
      const errorJSON = JSON.parse(err.message);
      errorMessage =
        "error" in errorJSON ? errorJSON.error : "title" in errorJSON ? errorJSON.title : defaultErrorMessage;
    } catch (error) {
      errorMessage = defaultErrorMessage;
    }
  }
  return errorMessage;
};

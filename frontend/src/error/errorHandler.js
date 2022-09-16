/**
 * Get the error message from the error object.
 * @param {the error returned by the redux thunk} err 
 * @returns the error message
 */
export const getErrorMessage = (err) => {
    let errorMessage = "Something went wrong";
    if (err.message) {
      try {
        errorMessage = JSON.parse(err.message).error;
      } catch (error) {
        errorMessage = err.message
      }
    }
    return errorMessage;
  };
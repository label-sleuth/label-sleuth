import { isRejected } from '@reduxjs/toolkit'
import { getErrorMessage } from './errorHandler'
import { setError } from './errorSlice'

/**
 * Middleware that updates the error state anytime an 
 * action thunk resolves into a rejected action.
 * @param {*} param0 
 * @returns 
 */
export const errorMiddleware = ({ dispatch }) => (next) => (action) => {
  if (isRejected(action)) {
    dispatch(setError(getErrorMessage(action.error)))
  }
  return next(action)
}
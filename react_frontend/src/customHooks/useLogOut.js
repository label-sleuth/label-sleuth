import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { clearState } from '../modules/Login/LoginSlice';

const useLogOut = () => {
    const dispatch = useDispatch()
    const navigate = useNavigate()

    const logout = (e) => {
        e.preventDefault()
        dispatch(clearState())
        if (localStorage.getItem('token')) {
          localStorage.removeItem('token')
        }
        navigate('/')
      }

    return { logout }
};

export default useLogOut;
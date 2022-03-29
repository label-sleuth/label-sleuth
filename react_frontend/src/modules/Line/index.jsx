import { styled, useTheme } from '@mui/material/styles';
import { Box } from '@mui/system';

const Line = styled(Box)( (props) => ({
    ...(props.focused && {
        borderRadius: 16,
        border: 1,
        borderColor: 'primary.main'
    })
}) )


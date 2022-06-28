import { Card, CardContent, CardHeader, Typography, IconButton } from "@mui/material"
import CloseIcon from '@mui/icons-material/Close';
import classes from "./UpperBar.module.css";

export const CategoryCard = ({ setCardOpen }) => (
  
    <Card className={classes["category-card"]} onClick={() => setCardOpen(false)}>
      <CardHeader
         action={
          <IconButton aria-label="close" style={{fontSize: "1rem"}} onClick={() => setCardOpen(false)}>
            <CloseIcon fontSize="inherit" />
          </IconButton>
        }
      />
      <CardContent>
        <Typography variant="body1" color="text.secondary">
            Please select a category or create a new one
        </Typography>
      </CardContent>
    </Card>
)
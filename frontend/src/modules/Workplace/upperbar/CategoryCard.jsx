import { Card, CardContent, Typography, IconButton } from "@mui/material"
import CloseIcon from '@mui/icons-material/Close';
import classes from "./UpperBar.module.css";

export const CategoryCard = ({ setCardOpen }) => (
  <>
   <div className={classes["arrow-left"]}></div>
    <Card className={classes["category-card"]}>
      <CardContent sx={{padding: '0px 10px 10px 10px'}}>
        <Typography sx={{lineHeight: '1.1'}} variant="caption" color="text.secondary">
            Please select a category or create a new one
        </Typography>
        <IconButton aria-label="close" style={{fontSize: "1rem"}} onClick={() => setCardOpen(false)}>
            <CloseIcon fontSize="inherit" />
          </IconButton>
      </CardContent>
    </Card>  
  </>

)
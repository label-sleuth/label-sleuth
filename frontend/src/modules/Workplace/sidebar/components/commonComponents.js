import Box from "@mui/material/Box";
import { Typography, CircularProgress } from "@mui/material";
import classes from "../index.module.css";
import Element from "../Element";
import { styled } from "@mui/system";

export const Header = ({ message }) => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        alignItem: "center",
        marginTop: "11px",
        borderBottom: "1px solid #e2e2e2",
        pb: "12px",
        justifyContent: "center",
      }}
    >
      <p style={{ width: "100%", textAlign: "center" }}>
        <strong>{message}</strong>
      </p>
    </Box>
  );
};

export const PanelTypography = styled(Typography)({
  display: "flex",
  justifyContent: "center",
  fontSize: "0.8rem",
  color: "rgba(0,0,0,.54)",
  paddingLeft: "15px",
  paddingRight: "15px",
});

export const Loading = () => (
  <div
    style={{
      display: "flex",
      justifyContent: "center",
    }}
  >
    <CircularProgress />
  </div>
);

export const ElementList = ({
  elements,
  loading,
  emptyResultsMessage,
  nonEmptyResultsMessage,
  children,
  isPaginationRequired,
  elementsTopPadding
}) => {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        mt: 1,
      }}
    >
      {elements === null ? (
        <PanelTypography text={""} />
      ) : elements.length === 0 ? (
        <PanelTypography>{emptyResultsMessage}</PanelTypography>
      ) : (
        <PanelTypography>{nonEmptyResultsMessage}</PanelTypography>
      )}
      <Box
        className={`${classes["element-list"]} ${
          isPaginationRequired ? classes.pagination_margin : ""
        }`}
        sx={elementsTopPadding ? { mt: elementsTopPadding } : {}}
      >
        {loading ? (
          <Loading />
        ) : children ? (
          { ...children }
        ) : elements && elements.length > 0 ? (
          elements.map((element, i) => (
            <Element element={element} key={element.id} />
          ))
        ) : null}
      </Box>
    </Box>
  );
};

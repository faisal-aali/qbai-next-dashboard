import Pagination from "@mui/material/Pagination";
import Box from "@mui/material/Box";

const CustomPagination = ({ page, count, onChange }) => {
  return (
    <Box display="flex" justifyContent="center" mt={2}>
      <Pagination
        count={count}
        page={page}
        onChange={onChange}
        color="primary"
        sx={{
          ".MuiButtonBase-root.MuiPaginationItem-root.Mui-selected": {
            backgroundColor: "#32e100",
            borderRadius: "4px",
            color: "#000000 !important"
          },
          ".MuiButtonBase-root.MuiPaginationItem-root": {
            color: "#89939E !important",
            fontSize: "16px",
            marginBottom: "0px",
          },
          ".MuiButtonBase-root.MuiPaginationItem-root.Mui-selected:hover": {
            backgroundColor: "#32e100",
          },
          ".MuiPaginationItem-root": {
            color: "#32e100",
            fontSize: "20px",
            marginBottom: "7px"
          }
        }}
      />
    </Box>
  );
};

export default CustomPagination;

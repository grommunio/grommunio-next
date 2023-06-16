import { Chip } from "@mui/material"

const CategoryChip = ({ color }) => {
  return <Chip
    size="small"
    label={color}
    color="default" // TODO: Get color from label (somehow)
    variant="outlined"
    sx={{ maxWidth: 100, mr: 0.5 }}
  />
}

export default CategoryChip;
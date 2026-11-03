import React, { useContext, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Rating,
  Snackbar,
  TextField,
  Typography,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { Add, Close } from "@mui/icons-material";
import Header from "../../components/Header";
import {
  useAddProductMutation,
  useGetProductsQuery,
} from "../../state/api";
import { AuthContext } from "../../../context/AuthContext";

const CATEGORIES = [
  { value: "eyeglasses", label: "Eyeglasses" },
  { value: "sunglasses", label: "Sunglasses" },
  { value: "contact-lenses", label: "Contact Lenses" },
  { value: "lens", label: "Lens" },
  { value: "accessories", label: "Accessories" },
];

const EMPTY_FORM = {
  name: "",
  category: "eyeglasses",
  brand: "",
  model: "",
  price: "",
  cost: "",
  stock: "",
  reorderLevel: "10",
  description: "",
};

const formatCategory = (category) => {
  const match = CATEGORIES.find((item) => item.value === category);
  if (match) return match.label;
  if (!category) return "Uncategorized";
  return category
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const formatCurrency = (value) =>
  `Rs. ${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const Product = ({ product }) => {
  const theme = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card
      sx={{
        backgroundImage: "none",
        backgroundColor: theme.palette.background.alt,
        borderRadius: "0.55rem",
      }}
    >
      <CardContent>
        <Typography
          sx={{ fontSize: 14 }}
          color={theme.palette.secondary[700]}
          gutterBottom
        >
          {formatCategory(product.category)}
        </Typography>
        <Typography variant="h5" component="div">
          {product.name || "Unnamed Product"}
        </Typography>
        <Typography sx={{ mb: "1.5rem" }} color={theme.palette.secondary[400]}>
          {formatCurrency(product.price)}
        </Typography>
        <Rating value={product.averageRating || 0} readOnly />

        <Typography variant="body2">
          {product.description || "No description available"}
        </Typography>
      </CardContent>
      <CardActions>
        <Button
          variant="primary"
          size="small"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          See More
        </Button>
      </CardActions>
      <Collapse
        in={isExpanded}
        timeout="auto"
        unmountOnExit
        sx={{
          color: theme.palette.neutral[300],
        }}
      >
        <CardContent>
          <Typography>SKU: {product.sku || "N/A"}</Typography>
          <Typography>Brand: {product.brand || "N/A"}</Typography>
          <Typography>Stock: {product.stock || 0}</Typography>
          <Typography>Reorder Level: {product.reorderLevel || 0}</Typography>
          <Typography>Total Sold: {product.totalSold || 0}</Typography>
        </CardContent>
      </Collapse>
    </Card>
  );
};

const Products = () => {
  const theme = useTheme();
  const isNonMobile = useMediaQuery("(min-width: 1000px)");
  const { user } = useContext(AuthContext);
  const { data, isLoading, error } = useGetProductsQuery();
  const [addProduct, { isLoading: isAdding }] = useAddProductMutation();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const isAdmin = (user?.role || "").toLowerCase() === "admin";

  const products = useMemo(() => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.products)) return data.products;
    return [];
  }, [data]);

  const handleOpen = () => {
    setForm(EMPTY_FORM);
    setFormError("");
    setOpen(true);
  };

  const handleClose = () => {
    if (isAdding) return;
    setOpen(false);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const validate = () => {
    if (!form.name.trim()) return "Product name is required";
    if (!form.category) return "Category is required";
    if (!form.brand.trim()) return "Brand is required";
    if (form.price === "" || !Number.isFinite(Number(form.price)) || Number(form.price) < 0) {
      return "Price must be a number of 0 or more";
    }
    if (form.cost === "" || !Number.isFinite(Number(form.cost)) || Number(form.cost) < 0) {
      return "Cost must be a number of 0 or more";
    }
    if (form.stock === "" || !Number.isFinite(Number(form.stock)) || Number(form.stock) < 0) {
      return "Stock must be a number of 0 or more";
    }
    if (
      form.reorderLevel !== "" &&
      (!Number.isFinite(Number(form.reorderLevel)) || Number(form.reorderLevel) < 0)
    ) {
      return "Reorder level must be a number of 0 or more";
    }
    return "";
  };

  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    try {
      await addProduct({
        name: form.name.trim(),
        category: form.category,
        brand: form.brand.trim(),
        model: form.model.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        cost: Number(form.cost),
        stock: Number(form.stock),
        reorderLevel:
          form.reorderLevel === "" ? 10 : Number(form.reorderLevel),
      }).unwrap();

      setOpen(false);
      setForm(EMPTY_FORM);
      setFormError("");
      setSnackbar({
        open: true,
        message: "Product added successfully",
        severity: "success",
      });
    } catch (submitError) {
      setFormError(
        submitError?.data?.message ||
          submitError?.message ||
          "Failed to add product"
      );
    }
  };

  const pageHeader = (
    <Box
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      flexWrap="wrap"
      gap="1rem"
    >
      <Header title="PRODUCTS" subtitle="See your list of products." />
      {isAdmin && (
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleOpen}
          sx={{
            backgroundColor: theme.palette.secondary[300],
            color: theme.palette.primary[600],
            "&:hover": { backgroundColor: theme.palette.secondary[400] },
          }}
        >
          Add Product
        </Button>
      )}
    </Box>
  );

  if (isLoading) {
    return (
      <Box m="1.5rem 2.5rem">
        {pageHeader}
        <Typography variant="h6" sx={{ mt: "20px" }}>
          Loading products...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box m="1.5rem 2.5rem">
        {pageHeader}
        <Typography variant="h6" color="error" sx={{ mt: "20px" }}>
          Error loading products:{" "}
          {error?.data?.message || error.message || "Unknown error"}
        </Typography>
      </Box>
    );
  }

  return (
    <Box m="1.5rem 2.5rem">
      {pageHeader}

      {products.length === 0 ? (
        <Typography variant="h6" sx={{ mt: "20px" }}>
          No products available
        </Typography>
      ) : (
        <Box
          mt="20px"
          display="grid"
          gridTemplateColumns="repeat(4, minmax(0, 1fr))"
          justifyContent="space-between"
          rowGap="20px"
          columnGap="1.33%"
          sx={{
            "& > div": { gridColumn: isNonMobile ? undefined : "span 4" },
          }}
        >
          {products.map((product) => (
            <Product key={product._id} product={product} />
          ))}
        </Box>
      )}

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          Add Product
          <IconButton
            aria-label="close"
            onClick={handleClose}
            disabled={isAdding}
            size="small"
          >
            <Close fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {formError && (
            <Alert severity="error" sx={{ mb: "1rem" }}>
              {formError}
            </Alert>
          )}
          <Box
            display="grid"
            gap="1rem"
            gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr" }}
            mt="0.5rem"
          >
            <TextField
              label="Product Name"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              fullWidth
              size="small"
            />
            <TextField
              select
              label="Category"
              name="category"
              value={form.category}
              onChange={handleChange}
              required
              fullWidth
              size="small"
            >
              {CATEGORIES.map((category) => (
                <MenuItem key={category.value} value={category.value}>
                  {category.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Brand"
              name="brand"
              value={form.brand}
              onChange={handleChange}
              required
              fullWidth
              size="small"
            />
            <TextField
              label="Model"
              name="model"
              value={form.model}
              onChange={handleChange}
              fullWidth
              size="small"
            />
            <TextField
              label="Price (Rs.)"
              name="price"
              type="number"
              inputProps={{ min: 0, step: "0.01" }}
              value={form.price}
              onChange={handleChange}
              required
              fullWidth
              size="small"
            />
            <TextField
              label="Cost (Rs.)"
              name="cost"
              type="number"
              inputProps={{ min: 0, step: "0.01" }}
              value={form.cost}
              onChange={handleChange}
              required
              fullWidth
              size="small"
            />
            <TextField
              label="Stock"
              name="stock"
              type="number"
              inputProps={{ min: 0, step: 1 }}
              value={form.stock}
              onChange={handleChange}
              required
              fullWidth
              size="small"
            />
            <TextField
              label="Reorder Level"
              name="reorderLevel"
              type="number"
              inputProps={{ min: 0, step: 1 }}
              value={form.reorderLevel}
              onChange={handleChange}
              fullWidth
              size="small"
            />
            <Box gridColumn={{ xs: "span 1", sm: "span 2" }}>
              <TextField
                label="Description"
                name="description"
                value={form.description}
                onChange={handleChange}
                fullWidth
                multiline
                minRows={3}
                size="small"
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={isAdding}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} variant="contained" disabled={isAdding}>
            {isAdding ? "Adding..." : "Add Product"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((previous) => ({ ...previous, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((previous) => ({ ...previous, open: false }))}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Products;

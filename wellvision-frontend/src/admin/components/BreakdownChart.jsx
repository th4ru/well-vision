import React, { useState } from "react";
import { ResponsivePie } from "@nivo/pie";
import {
  Box,
  Typography,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Divider,
} from "@mui/material";
import { Close } from "@mui/icons-material";
import { useGetSalesQuery } from "../state/api";

const BreakdownChart = ({ isDashboard = false }) => {
  const { data, isLoading } = useGetSalesQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const theme = useTheme();
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);

  if (!data || isLoading) return "Loading...";

  // Product category slugs stored in the database, mapped to the labels used
  // throughout the admin product pages.
  const categoryLabels = {
    eyeglasses: "Eyeglasses",
    sunglasses: "Sunglasses",
    "contact-lenses": "Contact Lenses",
    lens: "Lens",
    accessories: "Accessories",
    uncategorized: "Uncategorized",
  };

  const formatCurrency = (value) =>
    `Rs. ${Number(value || 0).toLocaleString(undefined, {
      maximumFractionDigits: 2,
    })}`;

  const colors = [
    theme.palette.secondary[500],
    theme.palette.secondary[300],
    theme.palette.secondary[200],
    theme.palette.secondary[400],
    theme.palette.secondary[600],
    theme.palette.secondary[100],
  ];

  let formattedData = [];
  try {
    if (data.salesByCategory) {
      formattedData = Object.entries(data.salesByCategory)
        .filter(([, sales]) => Number(sales) > 0)
        .map(([category, sales], i) => ({
          id: category,
          label: categoryLabels[category] || category,
          value: Number(sales) || 0,
          units: Number(data.unitsByCategory?.[category] || 0),
          products: data.productsByCategory?.[category] || [],
          color: colors[i % colors.length],
        }));
    }
  } catch (error) {
    console.error("Error formatting breakdown chart data:", error);
    formattedData = [];
  }

  const selectedCategory =
    formattedData.find((item) => item.id === selectedCategoryId) || null;

  if (formattedData.length === 0) {
    return (
      <Box
        height={isDashboard ? "400px" : "100%"}
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Typography variant="h6" color={theme.palette.secondary[200]}>
          No data available
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      height={isDashboard ? "400px" : "100%"}
      width={undefined}
      minHeight={isDashboard ? "325px" : undefined}
      minWidth={isDashboard ? "325px" : undefined}
      position="relative"
    >
      <ResponsivePie
        data={formattedData}
        theme={{
          axis: {
            domain: {
              line: {
                stroke: theme.palette.secondary[200],
              },
            },
            legend: {
              text: {
                fill: theme.palette.secondary[200],
              },
            },
            ticks: {
              line: {
                stroke: theme.palette.secondary[200],
                strokeWidth: 1,
              },
              text: {
                fill: theme.palette.secondary[200],
              },
            },
          },
          legends: {
            text: {
              fill: theme.palette.secondary[200],
            },
          },
          tooltip: {
            container: {
              color: theme.palette.primary.main,
            },
          },
        }}
        colors={{ datum: "data.color" }}
        valueFormat={(value) => formatCurrency(value)}
        onClick={(datum) => setSelectedCategoryId(datum.id)}
        margin={
          isDashboard
            ? { top: 40, right: 80, bottom: 100, left: 50 }
            : { top: 40, right: 80, bottom: 80, left: 80 }
        }
        sortByValue={true}
        innerRadius={0.45}
        activeOuterRadiusOffset={8}
        borderWidth={1}
        borderColor={{
          from: "color",
          modifiers: [["darker", 0.2]],
        }}
        enableArcLinkLabels={!isDashboard}
        arcLinkLabelsTextColor={theme.palette.secondary[200]}
        arcLinkLabelsThickness={2}
        arcLinkLabelsColor={{ from: "color" }}
        arcLabelsSkipAngle={10}
        arcLabelsTextColor={{
          from: "color",
          modifiers: [["darker", 2]],
        }}
        legends={[
          {
            anchor: "bottom",
            direction: "row",
            justify: false,
            translateX: isDashboard ? 20 : 0,
            translateY: isDashboard ? 50 : 56,
            itemsSpacing: 0,
            itemWidth: 85,
            itemHeight: 18,
            itemTextColor: "#999",
            itemDirection: "left-to-right",
            itemOpacity: 1,
            symbolSize: 18,
            symbolShape: "circle",
            effects: [
              {
                on: "hover",
                style: {
                  itemTextColor: theme.palette.primary[500],
                },
              },
            ],
          },
        ]}
      />
      <Box
        position="absolute"
        top="50%"
        left="50%"
        color={theme.palette.secondary[400]}
        textAlign="center"
        pointerEvents="none"
        sx={{
          transform: isDashboard
            ? "translate(-75%, -170%)"
            : "translate(-50%, -100%)",
        }}
      >
        <Typography variant="h6">
          {!isDashboard && "Total: "}
          {formatCurrency(data?.yearlySalesTotal)}
        </Typography>
        {!isDashboard && (
          <Typography variant="body2" sx={{ mt: "0.25rem" }}>
            Click a slice for products sold
          </Typography>
        )}
      </Box>

      <Dialog
        open={Boolean(selectedCategory)}
        onClose={() => setSelectedCategoryId(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: theme.palette.background.alt,
          }}
        >
          {selectedCategory?.label || "Category"}
          <IconButton
            size="small"
            onClick={() => setSelectedCategoryId(null)}
            aria-label="close"
          >
            <Close fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedCategory && (
            <Box display="flex" flexDirection="column" gap="1rem">
              <Box textAlign="center">
                <Typography
                  variant="body2"
                  sx={{ color: theme.palette.secondary[300] }}
                >
                  Products sold
                </Typography>
                <Typography variant="h3" fontWeight="bold">
                  {selectedCategory.units}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: theme.palette.secondary[300] }}
                >
                  {selectedCategory.units === 1 ? "unit" : "units"}
                </Typography>
              </Box>

              <Divider />

              <Box>
                <Typography fontWeight="bold" mb="0.5rem">
                  Products
                </Typography>
                {selectedCategory.products.length > 0 ? (
                  selectedCategory.products.map((product) => (
                    <Box
                      key={product.name}
                      display="flex"
                      justifyContent="space-between"
                      gap={2}
                      py="0.25rem"
                    >
                      <Typography>{product.name}</Typography>
                      <Typography fontWeight="600">
                        {product.quantity}
                      </Typography>
                    </Box>
                  ))
                ) : (
                  <Typography sx={{ color: theme.palette.secondary[300] }}>
                    No product details available
                  </Typography>
                )}
              </Box>

              <Divider />

              <Box display="flex" justifyContent="space-between" gap={2}>
                <Typography sx={{ color: theme.palette.secondary[300] }}>
                  Sales
                </Typography>
                <Typography fontWeight="bold">
                  {formatCurrency(selectedCategory.value)}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedCategoryId(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BreakdownChart;

import React, { useMemo, useState } from "react";
import { Box, useTheme, Button, Typography } from "@mui/material";
import Header from "../../components/Header";
import { ResponsiveLine } from "@nivo/line";
import { useGetSalesQuery } from "../../state/api";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const Daily = () => {
  const [startDate, setStartDate] = useState(new Date("2021-02-01"));
  const [endDate, setEndDate] = useState(new Date("2021-03-01"));
  const [view, setView] = useState("sales");
  const { data, isLoading, isError } = useGetSalesQuery();
  const theme = useTheme();

  const formattedData = useMemo(() => {
    // Build safe sample fallback when no data
    if (!data || !data.dailyData || typeof data.dailyData !== 'object') {
      const sampleSalesLine = {
        id: "totalSales",
        color: theme.palette.secondary.main,
        data: [
          { x: "09-01", y: 120 },
          { x: "09-02", y: 150 },
          { x: "09-03", y: 180 },
          { x: "09-04", y: 200 },
          { x: "09-05", y: 220 },
          { x: "09-06", y: 190 },
          { x: "09-07", y: 210 },
          { x: "09-08", y: 230 },
          { x: "09-09", y: 250 },
          { x: "09-10", y: 270 },
          { x: "09-11", y: 240 },
          { x: "09-12", y: 260 },
          { x: "09-13", y: 280 },
          { x: "09-14", y: 300 },
          { x: "09-15", y: 320 },
          { x: "09-16", y: 290 },
          { x: "09-17", y: 310 },
          { x: "09-18", y: 330 },
        ],
      };
      const sampleUnitsLine = {
        id: "totalUnits",
        color: theme.palette.secondary[600],
        data: [
          { x: "09-01", y: 60 },
          { x: "09-02", y: 75 },
          { x: "09-03", y: 90 },
          { x: "09-04", y: 100 },
          { x: "09-05", y: 110 },
          { x: "09-06", y: 95 },
          { x: "09-07", y: 105 },
          { x: "09-08", y: 115 },
          { x: "09-09", y: 125 },
          { x: "09-10", y: 135 },
          { x: "09-11", y: 120 },
          { x: "09-12", y: 130 },
          { x: "09-13", y: 140 },
          { x: "09-14", y: 150 },
          { x: "09-15", y: 160 },
          { x: "09-16", y: 145 },
          { x: "09-17", y: 155 },
          { x: "09-18", y: 165 },
        ],
      };
      return view === "sales" ? [sampleSalesLine] : [sampleUnitsLine];
    }

    const { dailyData } = data;
    const totalSalesLine = {
      id: "totalSales",
      color: theme.palette.secondary.main,
      data: [],
    };
    const totalUnitsLine = {
      id: "totalUnits",
      color: theme.palette.secondary[600],
      data: [],
    };

    try {
      Object.values(dailyData).forEach((item) => {
        if (!item || typeof item !== 'object' || !item.date) return;

        const { date, totalSales, totalUnits } = item;
        const dateFormatted = new Date(date);
        if (isNaN(dateFormatted)) return;
        if (dateFormatted >= startDate && dateFormatted <= endDate) {
          const splitDate = date.substring(date.indexOf("-") + 1);
          const ySales = Number(totalSales);
          const yUnits = Number(totalUnits);
          totalSalesLine.data.push({ x: splitDate, y: Number.isFinite(ySales) ? ySales : 0 });
          totalUnitsLine.data.push({ x: splitDate, y: Number.isFinite(yUnits) ? yUnits : 0 });
        }
      });
    } catch (error) {
      console.error("Error processing daily chart data:", error);
      return [];
    }

    const formattedData = view === "sales" ? [totalSalesLine] : [totalUnitsLine];
    return formattedData;
  }, [data, startDate, endDate, view]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Box m="1.5rem 2.5rem" sx={{ display: 'flex', flexDirection: 'column', minHeight: 0, height: 'calc(100vh - 3rem)' }}>
      <Header title="DAILY SALES" subtitle="Chart of daily sales" />
      <Box sx={{ flex: '1 1 auto', minWidth: 0, overflow: 'visible', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2, flexWrap: 'wrap', gap: 2 }}>
          <Box display="flex" gap="1rem">
            <Button
              variant={view === "sales" ? "contained" : "outlined"}
              onClick={() => setView("sales")}
            >
              Sales
            </Button>
            <Button
              variant={view === "units" ? "contained" : "outlined"}
              onClick={() => setView("units")}
            >
              Units
            </Button>
          </Box>
          <Box display="flex" gap="1rem">
            <Box>
              <DatePicker
                selected={startDate}
                onChange={(date) => setStartDate(date)}
                selectsStart
                startDate={startDate}
                endDate={endDate}
              />
            </Box>
            <Box>
              <DatePicker
                selected={endDate}
                onChange={(date) => setEndDate(date)}
                selectsEnd
                startDate={startDate}
                endDate={endDate}
                minDate={startDate}
              />
            </Box>
          </Box>
        </Box>

        {isError ? (
          <Box sx={{ height: 360, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px dashed ${theme.palette.neutral?.[300] || '#ccc'}`, borderRadius: 1 }}>
            <Typography color="text.secondary">Failed to load data</Typography>
          </Box>
        ) : isLoading ? (
          <Box sx={{ height: 360, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography color="text.secondary">Loading...</Typography>
          </Box>
        ) : (!formattedData || !formattedData.length || !formattedData[0]?.data?.length) ? (
          <Box sx={{ height: 360, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px dashed ${theme.palette.neutral?.[300] || '#ccc'}`, borderRadius: 1 }}>
            <Typography color="text.secondary">No data to display</Typography>
          </Box>
        ) : (
          <Box sx={{ width: '100%', height: 'calc(100vh - 340px)', minHeight: 460 }}>
            <ResponsiveLine
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
            colors={{ datum: "color" }}
            margin={{ top: 20, right: 50, bottom: 100, left: 70 }}
            xScale={{ type: "point" }}
            yScale={{
              type: "linear",
              min: "auto",
              max: "auto",
              stacked: false,
              reverse: false,
            }}
            yFormat=" >-.2f"
            curve="catmullRom"
            enableArea={false}
            axisTop={null}
            axisRight={null}
            axisBottom={{
              orient: "bottom",
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 0,
              legend: "Date",
              legendOffset: 40,
              legendPosition: "middle",
              tickRotation: 20,
            }}
            axisLeft={{
              orient: "left",
              tickValues: 5,
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 0,
              legend: `Total ${view === "sales" ? "Revenue" : "Units"} for Year`,
              legendOffset: -60,
              legendPosition: "middle",
            }}
            enableGridX={false}
            enableGridY={false}
            pointSize={10}
            pointColor={{ theme: "background" }}
            pointBorderWidth={2}
            pointBorderColor={{ from: "serieColor" }}
            pointLabelYOffset={-12}
            useMesh={true}
            legends={[
              {
                anchor: "bottom-right",
                direction: "column",
                justify: false,
                translateX: 30,
                translateY: -20,
                itemsSpacing: 0,
                itemDirection: "left-to-right",
                itemWidth: 80,
                itemHeight: 20,
                itemOpacity: 0.75,
                symbolSize: 12,
                symbolShape: "circle",
                symbolBorderColor: "rgba(0, 0, 0, .5)",
                effects: [
                  {
                    on: "hover",
                    style: {
                      itemBackground: "rgba(0, 0, 0, .03)",
                      itemOpacity: 1,
                    },
                  },
                ],
              },
            ]}
          />
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default Daily;

import { createTheme, type MantineColorsTuple } from "@mantine/core";

const MARWIN_BLUE: MantineColorsTuple = [
  "#e6f0fd",
  "#cfe0fa",
  "#a0bff3",
  "#6d9ced",
  "#4580e8",
  "#2f80ed",
  "#196ddb",
  "#0f5bbf",
  "#0550a9",
  "#004493",
];

export const theme = createTheme({
  colors: { marwin: MARWIN_BLUE },
  primaryColor: "marwin",
  primaryShade: 5,
  defaultRadius: "md",
  fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
});

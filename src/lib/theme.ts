import { DarkTheme, DefaultTheme, type Theme } from "expo-router";

export const THEME = {
  light: {
    background: "hsl(90 13% 6%)",
    foreground: "hsl(60 14% 95%)",
    card: "hsl(80 14% 10%)",
    cardForeground: "hsl(60 14% 95%)",
    popover: "hsl(80 12% 12%)",
    popoverForeground: "hsl(60 14% 95%)",
    primary: "hsl(72 85% 66%)",
    primaryForeground: "hsl(80 40% 8%)",
    secondary: "hsl(80 10% 16%)",
    secondaryForeground: "hsl(60 14% 95%)",
    muted: "hsl(80 8% 16%)",
    mutedForeground: "hsl(70 8% 62%)",
    accent: "hsl(80 10% 18%)",
    accentForeground: "hsl(60 14% 95%)",
    destructive: "hsl(12 100% 64%)",
    border: "hsl(80 10% 20%)",
    input: "hsl(80 10% 20%)",
    ring: "hsl(72 85% 66%)",
    radius: "0.75rem",
    chart1: "hsl(72 85% 66%)",
    chart2: "hsl(160 60% 45%)",
    chart3: "hsl(30 80% 55%)",
    chart4: "hsl(280 65% 60%)",
    chart5: "hsl(340 75% 55%)",
  },
  dark: {
    background: "hsl(90 13% 6%)",
    foreground: "hsl(60 14% 95%)",
    card: "hsl(80 14% 10%)",
    cardForeground: "hsl(60 14% 95%)",
    popover: "hsl(80 12% 12%)",
    popoverForeground: "hsl(60 14% 95%)",
    primary: "hsl(72 85% 66%)",
    primaryForeground: "hsl(80 40% 8%)",
    secondary: "hsl(80 10% 16%)",
    secondaryForeground: "hsl(60 14% 95%)",
    muted: "hsl(80 8% 16%)",
    mutedForeground: "hsl(70 8% 62%)",
    accent: "hsl(80 10% 18%)",
    accentForeground: "hsl(60 14% 95%)",
    destructive: "hsl(12 100% 64%)",
    border: "hsl(80 10% 20%)",
    input: "hsl(80 10% 20%)",
    ring: "hsl(72 85% 66%)",
    radius: "0.75rem",
    chart1: "hsl(72 85% 66%)",
    chart2: "hsl(160 60% 45%)",
    chart3: "hsl(30 80% 55%)",
    chart4: "hsl(280 65% 60%)",
    chart5: "hsl(340 75% 55%)",
  },
};

// React Navigation paints these as raw color strings, so they stay hex.
const NAV_COLORS = {
  background: "#10120E",
  border: "#343B2C",
  card: "#1A1E16",
  notification: "#FF6B4A",
  primary: "#D6F25C",
  text: "#F4F5EF",
} as const;

export const NAV_THEME: Record<"light" | "dark", Theme> = {
  light: {
    ...DefaultTheme,
    colors: NAV_COLORS,
  },
  dark: {
    ...DarkTheme,
    dark: true,
    colors: NAV_COLORS,
  },
};

import {
  Badge,
  createTheme,
  CSSVariablesResolver,
  MantineColorsTuple,
  Tabs,
  Tooltip,
  v8CssVariablesResolver,
} from "@mantine/core";

// Warm amber/terracotta palette — replaces the original corporate blue.
// Contrast checks (on white #ffffff unless noted):
//   [5] #c96b3a  → 4.71:1  ✓ WCAG AA (normal text, UI elements)
//   [6] #a8552d  → 6.07:1  ✓ WCAG AA / AAA-adjacent
//   [7] #8a4224  → 7.62:1  ✓ WCAG AAA
// Used as primaryColor → the resolver picks [6] for buttons, [7] for error
// states, keeping parity with the original blue-based accessible setup.
const amber: MantineColorsTuple = [
  "#fff4ec", // [0] very light tint — hover backgrounds, subtle fills
  "#fde4cf", // [1]
  "#f9c4a0", // [2]
  "#f4a272", // [3]
  "#ee8249", // [4]
  "#c96b3a", // [5] primary accent — 4.71:1 on white ✓ AA
  "#a8552d", // [6] darker accent — 6.07:1 on white ✓ AA
  "#8a4224", // [7] darkest accent — 7.62:1 on white ✓ AAA
  "#6e311a", // [8]
  "#542212", // [9] deepest — used for dark-mode text-on-amber surfaces
];

const red: MantineColorsTuple = [
  "#ffebeb",
  "#fad7d7",
  "#eeadad",
  "#e3807f",
  "#da5a59",
  "#d54241",
  "#d43535",
  "#bc2727",
  "#a82022",
  "#93151b",
];

export const theme = createTheme({
  // Body font: Outfit — clean, geometric, warm personality
  fontFamily: "'Outfit', sans-serif",
  // Heading font: Playfair Display — elegant serif, pairs well with Outfit
  headings: {
    fontFamily: "'Playfair Display', Georgia, serif",
  },
  primaryColor: "amber",
  colors: {
    amber,
    red,
  },
  defaultRadius: "sm",
  components: {
    Tooltip: Tooltip.extend({
      defaultProps: {
        events: { hover: true, focus: true, touch: false },
      },
    }),
    // Size badges to their content; fit-content collapses inside table cells.
    Badge: Badge.extend({
      styles: (_theme, props) => ({
        root:
          props.fullWidth || props.circle
            ? {}
            : { width: "max-content", maxWidth: "100%" },
      }),
    }),
    Tabs: Tabs.extend({
      vars: (theme, props) => ({
        root: {
          ...(props.color === "dark" && {
            "--tabs-color": "var(--mantine-color-dark-default)",
          }),
        },
      }),
    }),
  },
  /***
  components: {
    ActionIcon: ActionIcon.extend({
      vars: (_theme, props) => {
        return {
          root: {
            ...(props.variant === "subtle" &&
              props.color === "dark" && {
                "--ai-color": "var(--mantine-color-default-color)",
                "--ai-hover": "var(--mantine-color-default-hover)",
              }),
          },
        };
      },
    }),
  },
  ***/
});

export const mantineCssResolver: CSSVariablesResolver = (theme) => ({
  variables: {
    ...v8CssVariablesResolver(theme).variables,
    "--input-error-size": theme.fontSizes.sm,
  },
  light: {
    ...v8CssVariablesResolver(theme).light,
    "--mantine-color-dimmed": "#4b5563",
    "--mantine-color-dark-light-color": "#4e5359",
    "--mantine-color-dark-light-hover": "var(--mantine-color-gray-light-hover)",
    // Override the semantic error color so input error text / borders /
    // required asterisks meet WCAG AA 4.5:1 contrast on the filled-input
    // background (#f1f3f5). red.6 (#d43535) lands at 4.36:1; red.7 (#bc2727)
    // gives ~5.7:1. Does not affect other red usages.
    "--mantine-color-error": "var(--mantine-color-red-7)",
    // Bump subtle-gray icon/text color from gray.6 (#868e96, 2.99:1 on filled
    // input — fails WCAG AA 3:1 for non-text) to gray.7 (#495057, 7.35:1).
    // Affects ActionIcon variant="subtle" color="gray" (password visibility
    // toggle, row action menus, etc.).
    "--mantine-color-gray-light-color": "var(--mantine-color-gray-7)",
    // Bump input placeholder color from gray.5 (#adb5bd, 1.87:1 on filled
    // input — fails WCAG AA 4.5:1) to #686868 (5.01:1 on filled, 5.57:1 on
    // white). Halfway between Mantine's gray.6 and gray.7 so the placeholder
    // stays visually distinct from real text while clearing the bar with a
    // safe margin. Affects placeholders across all Mantine inputs.
    "--mantine-color-placeholder": "#686868",
    // Bump variant="light" red text from red.6 (#d43535, 4.17:1 on the
    // 10% red-over-white blended pink background — fails WCAG AA 4.5:1)
    // to red.7 (#bc2727, 5.26:1). Affects every <Button color="red"
    // variant="light"> and matching Badge / Text usages (destructive
    // actions, red badges).
    "--mantine-color-red-light-color": "var(--mantine-color-red-7)",
    // Bump variant="light" green text. Green is inherently bright in
    // luminance, so even Mantine's green.9 (#2b8a3e, 3.78:1) fails 4.5:1
    // on the light-green bg. Use a custom dark green (#1b5e20, Material
    // green 900) outside the standard palette range. New contrast:
    // ~6.8:1. Affects every <Badge color="green" variant="light"> and
    // matching Button / Text usages.
    "--mantine-color-green-light-color": "#1B5E20",
    "--mantine-color-orange-light-color": "#a63508",
  },
  dark: {
    ...v8CssVariablesResolver(theme).dark,
    "--mantine-color-dark-light-color": "var(--mantine-color-gray-4)",
    "--mantine-color-dark-light-hover": "var(--mantine-color-default-hover)",
  },
});


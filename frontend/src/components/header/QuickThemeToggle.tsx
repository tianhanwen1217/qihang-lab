import { ActionIcon, Tooltip, useMantineColorScheme } from "@mantine/core";
import { TbMoon, TbSun } from "react-icons/tb";
import userPreferences from "../../utils/userPreferences.util";

export default function QuickThemeToggle() {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const next = colorScheme === "dark" ? "light" : "dark";

  return (
    <Tooltip label={`切换为${next === "dark" ? "深色" : "浅色"}模式`}>
      <ActionIcon
        aria-label={`切换为${next === "dark" ? "深色" : "浅色"}模式`}
        size={36}
        radius="xl"
        variant="subtle"
        sx={{
          color: "var(--qh-text-soft)",
          border: "1px solid var(--qh-border)",
          background: "var(--qh-surface)",
          transition: "transform 180ms ease, background-color 180ms ease",
          "&:hover": {
            color: "var(--qh-brand-strong)",
            background: "var(--qh-brand-soft)",
            transform: "rotate(8deg)",
          },
        }}
        onClick={() => {
          userPreferences.set("colorScheme", next);
          toggleColorScheme(next);
        }}
      >
        {colorScheme === "dark" ? <TbSun size={18} /> : <TbMoon size={18} />}
      </ActionIcon>
    </Tooltip>
  );
}

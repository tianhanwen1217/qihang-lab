import { MantineThemeOverride } from "@mantine/core";

export default <MantineThemeOverride>{
  colors: {
    qihang: [
      "#e8f8ff",
      "#c9efff",
      "#9ee3ff",
      "#67d5ff",
      "#29c8ff",
      "#1aaef2",
      "#168cff",
      "#126fce",
      "#0e57a4",
      "#0a3f7a",
    ],
  },
  primaryColor: "qihang",
  primaryShade: 6,
  defaultRadius: "md",
  fontFamily: `Inter, "Noto Sans SC", "Microsoft YaHei", "PingFang SC", system-ui, sans-serif`,
  headings: {
    fontFamily: `Inter, "Noto Sans SC", "Microsoft YaHei", "PingFang SC", system-ui, sans-serif`,
    fontWeight: 800,
  },
  components: {
    Button: {
      defaultProps: {
        radius: "xl",
      },
      styles: {
        root: {
          fontWeight: 600,
          letterSpacing: "0.02em",
        },
      },
    },
    Paper: {
      styles: () => ({
        root: {
          borderColor: "var(--qh-border)",
          backgroundColor: "var(--qh-surface)",
        },
      }),
    },
    Modal: {
      styles: () => ({
        content: {
          border: "1px solid var(--qh-border)",
          borderRadius: 16,
          background: "var(--qh-surface-raised)",
        },
        header: {
          background: "var(--qh-surface-raised)",
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
        },
        title: {
          fontSize: 18,
          fontWeight: 700,
        },
      }),
    },
    Notification: {
      styles: () => ({
        root: {
          minHeight: 76,
          padding: "14px 12px",
          border: "1px solid var(--qh-border-strong)",
          borderRadius: 14,
          background: "var(--qh-surface-raised)",
          boxShadow: "var(--qh-shadow)",
          backdropFilter: "blur(18px)",
        },
        icon: {
          width: 36,
          height: 36,
          marginRight: 12,
          borderRadius: 12,
          boxShadow: "0 8px 20px rgba(0,0,0,.14)",
        },
        body: {
          minWidth: 0,
        },
        title: {
          color: "var(--qh-text)",
          fontSize: 14,
          fontWeight: 800,
          letterSpacing: "0.02em",
        },
        description: {
          color: "var(--qh-text-soft)",
          fontSize: 13,
          lineHeight: 1.55,
        },
        closeButton: {
          color: "var(--qh-muted)",
          borderRadius: 8,
          "&:hover": {
            color: "var(--qh-text)",
            background: "var(--qh-surface-soft)",
          },
        },
      }),
    },
    TextInput: {
      styles: {
        input: {
          borderRadius: 10,
          transition: "border-color 0.2s ease, box-shadow 0.2s ease",
        },
      },
    },
    PasswordInput: {
      styles: {
        input: {
          borderRadius: 10,
        },
      },
    },
    Badge: {
      styles: {
        root: {
          fontWeight: 600,
          letterSpacing: "0.03em",
        },
      },
    },
    Pagination: {
      styles: {
        control: {
          borderRadius: 10,
          borderColor: "var(--qh-border)",
          transition: "all 0.2s ease",
        },
      },
    },
  },
};

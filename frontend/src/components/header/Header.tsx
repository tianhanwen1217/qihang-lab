import {
  Box,
  Burger,
  Container,
  createStyles,
  Group,
  Header as MantineHeader,
  Paper,
  Stack,
  Text,
  Transition,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import Link from "next/link";
import { useRouter } from "next/router";
import { ReactNode, useEffect, useState } from "react";
import useUser from "../../hooks/user.hook";
import useTranslate from "../../hooks/useTranslate.hook";
import BrandMark from "../BrandMark";
import ActionAvatar from "./ActionAvatar";
import NavbarShareMenu from "./NavbarShareMenu";
import QuickThemeToggle from "./QuickThemeToggle";

const HEADER_HEIGHT = 68;

type NavLink = {
  link?: string;
  label?: string;
  component?: ReactNode;
};

const useStyles = createStyles((theme) => ({
  root: {
    position: "sticky",
    top: 0,
    zIndex: 200,
    borderBottom: "1px solid var(--qh-border)",
    background: "var(--qh-header)",
    backdropFilter: "blur(16px)",
    transition:
      "background 0.3s ease, backdrop-filter 0.3s ease, border-bottom-color 0.3s ease, box-shadow 0.3s ease",
  },
  /* 滚动后增强毛玻璃 */
  header: {
    display: "flex",
    height: "100%",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brandLink: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    textDecoration: "none",
    color: "inherit",
    borderRadius: 10,
    padding: "4px 8px 4px 4px",
    margin: "-4px -8px -4px -4px",
    transition: "background 0.2s ease",

    /* Logo Hover 起航动画 */
    "&:hover .qihang-logo-img": {
      animation: "qihang-logo-sail-red 0.7s ease-in-out",
    },
    "&:hover .qihang-logo-yellow": {
      animation: "qihang-logo-sail-yellow 0.7s ease-in-out 0.05s",
    },
    "&:hover .qihang-logo-trail-line": {
      animation: "qihang-logo-trail 0.7s ease-out 0.15s forwards",
    },
    "&:hover": {
      background: "var(--qh-brand-soft)",
    },
  },
  brandName: {
    color: "var(--qh-text)",
    fontSize: 15,
    fontWeight: 800,
    lineHeight: 1.05,
    letterSpacing: "0.05em",
    transition: "color 0.2s ease",

    ".qihang-brand-link:hover &": {
      color: "var(--qh-brand-strong)",
    },
  },
  brandEnglish: {
    color: "var(--qh-muted)",
    fontSize: 8,
    fontWeight: 700,
    letterSpacing: "0.24em",
    position: "relative",
  },
  /* Logo 航迹指示线 */
  brandTrail: {
    position: "absolute",
    bottom: -1,
    left: 0,
    width: 22,
    height: 1,
    borderRadius: 1,
    background: "linear-gradient(90deg, #29c8ff, transparent)",
    opacity: 0,
  },
  links: {
    [theme.fn.smallerThan("sm")]: {
      display: "none",
    },
  },
  burger: {
    color: "var(--qh-text)",
    [theme.fn.largerThan("sm")]: {
      display: "none",
    },
  },
  link: {
    display: "block",
    padding: "9px 14px",
    color: "var(--qh-text-soft)",
    border: "1px solid transparent",
    borderRadius: 999,
    fontSize: theme.fontSizes.sm,
    fontWeight: 600,
    lineHeight: 1,
    transition: "all 0.2s ease",

    "&:hover": {
      color: "var(--qh-text)",
      borderColor: "var(--qh-border)",
      background: "var(--qh-brand-soft)",
    },

    [theme.fn.smallerThan("sm")]: {
      borderRadius: 8,
      padding: theme.spacing.md,
    },
  },
  linkActive: {
    color: "var(--qh-brand-strong)",
    borderColor: "var(--qh-border-strong)",
    background: "var(--qh-brand-soft)",
  },
  dropdown: {
    position: "absolute",
    top: HEADER_HEIGHT,
    left: 0,
    right: 0,
    zIndex: 199,
    padding: 10,
    border: "1px solid var(--qh-border)",
    borderTop: 0,
    borderRadius: "0 0 12px 12px",
    background: "var(--qh-header)",
    backdropFilter: "blur(20px)",
    touchAction: "manipulation",

    [theme.fn.largerThan("sm")]: {
      display: "none",
    },
  },
}));

const Header = () => {
  const { user } = useUser();
  const router = useRouter();
  const t = useTranslate();
  const [opened, openedHandlers] = useDisclosure(false);
  const [currentRoute, setCurrentRoute] = useState("");
  const { classes, cx } = useStyles();

  useEffect(() => setCurrentRoute(router.pathname), [router.pathname]);
  useEffect(() => openedHandlers.close(), [router.asPath]);

  const authenticatedLinks: NavLink[] = [
    { link: "/", label: "文件首页" },
    { link: "/recruit", label: "实验室招新" },
    { link: "/upload", label: t("navbar.upload") },
    { component: <NavbarShareMenu /> },
    { component: <ActionAvatar /> },
  ];

  const unauthenticatedLinks: NavLink[] = [
    { link: "/", label: "小登" },
    { link: "/recruit", label: "实验室招新" },
    { link: "/auth/signIn", label: "老登" },
  ];

  const items = (
    <>
      {(user ? authenticatedLinks : unauthenticatedLinks).map((item, index) =>
        item.component ? (
          <Box px={5} py={10} key={index}>
            {item.component}
          </Box>
        ) : (
          <Link
            key={item.label}
            href={item.link ?? ""}
            onClick={openedHandlers.close}
            className={cx(classes.link, {
              [classes.linkActive]: currentRoute === item.link,
            })}
          >
            {item.label}
          </Link>
        ),
      )}
    </>
  );

  return (
    <MantineHeader
      height={HEADER_HEIGHT}
      className={classes.root}
    >
      <Container size={1440} className={classes.header}>
        <Link href="/" className={classes.brandLink}>
          <span className="qihang-logo-img">
            <BrandMark size={39} />
          </span>
          <div>
            <Text className={classes.brandName}>起航实验室</Text>
            <Text className={classes.brandEnglish}>
              QIHANG LAB
              <span
                className={`${classes.brandTrail} qihang-logo-trail-line`}
              />
            </Text>
          </div>
        </Link>

        <Group spacing={5} className={classes.links}>
          {items}
          <QuickThemeToggle />
        </Group>

        <Group spacing={8} className={classes.burger}>
          <QuickThemeToggle />
          <Burger
            opened={opened}
            onClick={openedHandlers.toggle}
            size="sm"
            color="var(--qh-text)"
          />
        </Group>

        <Transition transition="pop-top-right" duration={180} mounted={opened}>
          {(styles) => (
            <Paper className={classes.dropdown} style={styles}>
              <Stack spacing={2}>{items}</Stack>
            </Paper>
          )}
        </Transition>
      </Container>
    </MantineHeader>
  );
};

export default Header;

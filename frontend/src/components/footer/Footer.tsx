import { Container, Footer as MFooter, Group, Text } from "@mantine/core";
import BrandMark from "../BrandMark";

const Footer = () => {
  return (
    <MFooter
      height="auto"
      py="md"
      sx={{
        color: "var(--qh-muted)",
        fontSize: 13,
        borderTop: "1px solid var(--qh-border)",
        background: "var(--qh-surface)",
        backdropFilter: "blur(12px)",
      }}
    >
      <Container size={1440}>
        <Group position="apart" spacing="md">
          <Group spacing={8}>
            <BrandMark size={24} />
            <Text size="xs" color="dimmed">
              起航实验室 · QIHANG LAB
            </Text>
          </Group>

          <Group spacing="md">
            <Text size="xs" color="dimmed">
              电路即航路，技术即风帆
            </Text>
            <Text
              size="xs"
              sx={{
                color: "var(--qh-text-soft)",
                fontWeight: 700,
                letterSpacing: "0.04em",
              }}
            >
              Designed by Soul
            </Text>
          </Group>
        </Group>
      </Container>
    </MFooter>
  );
};

export default Footer;

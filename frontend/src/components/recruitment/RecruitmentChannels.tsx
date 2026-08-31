import { Badge, Center, createStyles, Image, Paper, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { useEffect, useState } from "react";
import { TbQrcode } from "react-icons/tb";
import recruitmentService from "../../services/recruitment.service";
import { RecruitmentChannel } from "../../types/recruitment.type";

const useStyles = createStyles((theme) => ({
  grid: { margin: "0 auto" },
  card: {
    position: "relative",
    padding: "26px 24px 24px",
    textAlign: "center",
    overflow: "hidden",
    border: "1px solid var(--qh-border)",
    background: "var(--qh-surface-raised)",
    boxShadow: "var(--qh-shadow)",
    transition: "transform .2s ease,border-color .2s ease",
    "&:hover": { transform: "translateY(-3px)", borderColor: "var(--qh-brand)" },
    "&::before": { content: "\"\"", position: "absolute", left: 20, right: 20, top: 0, height: 1, background: "linear-gradient(90deg,transparent,#29c8ff,transparent)" },
  },
  image: {
    width: "min(100%,240px)",
    margin: "0 auto",
    padding: 12,
    borderRadius: 16,
    background: "#fff",
    boxShadow: "0 14px 38px rgba(0,0,0,.3)",
  },
  empty: {
    minHeight: 220,
    border: "1px dashed var(--qh-border-strong)",
    borderRadius: 20,
    background: "var(--qh-surface)",
    [theme.fn.smallerThan("sm")]: { minHeight: 190, padding: 24, textAlign: "center" },
  },
}));

export default function RecruitmentChannels() {
  const { classes } = useStyles();
  const [channels, setChannels] = useState<RecruitmentChannel[]>();

  useEffect(() => {
    recruitmentService.list().then(setChannels).catch(() => setChannels([]));
  }, []);

  if (channels === undefined) return null;

  if (!channels.length) {
    return (
      <Center className={classes.empty}>
        <Stack align="center" spacing={8}>
          <TbQrcode size={38} color="#5bd9ff" />
          <Title order={3}>招新通道筹备中</Title>
          <Text color="dimmed">二维码发布后会在这里展示，敬请期待。</Text>
        </Stack>
      </Center>
    );
  }

  return (
    <SimpleGrid
      className={classes.grid}
      sx={{ maxWidth: channels.length === 1 ? 390 : channels.length === 2 ? 800 : 1180 }}
      cols={Math.min(channels.length, 3)}
      spacing="lg"
      breakpoints={[{ maxWidth: "sm", cols: 1 }]}
    >
      {channels.map((channel) => (
        <Paper key={channel.id} className={classes.card} radius="lg">
          <Badge mb="md" variant="light" color="cyan">扫码加入</Badge>
          <Image src={channel.imageUrl} alt={`${channel.name}二维码`} className={classes.image} fit="contain" withPlaceholder />
          <Title order={3} mt="lg">{channel.name}</Title>
          {channel.description && <Text color="dimmed" size="sm" mt="xs" sx={{ lineHeight: 1.7 }}>{channel.description}</Text>}
        </Paper>
      ))}
    </SimpleGrid>
  );
}

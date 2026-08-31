import {
  ActionIcon,
  Button,
  createStyles,
  FileButton,
  Group,
  Image,
  Paper,
  SimpleGrid,
  Stack,
  Switch,
  Text,
  Textarea,
  TextInput,
  Title,
} from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import { useEffect, useState } from "react";
import { TbArrowDown, TbArrowUp, TbPhoto, TbPlus, TbTrash } from "react-icons/tb";
import Meta from "../../components/Meta";
import recruitmentService from "../../services/recruitment.service";
import { RecruitmentChannel } from "../../types/recruitment.type";
import toast from "../../utils/toast.util";

const useStyles = createStyles((theme) => ({
  channelLayout: {
    alignItems: "flex-start",
    flexWrap: "nowrap",
    [theme.fn.smallerThan("sm")]: { flexDirection: "column" },
  },
  qrImage: {
    flex: "0 0 144px",
    padding: 8,
    borderRadius: 12,
    background: "#fff",
    [theme.fn.smallerThan("sm")]: { alignSelf: "center" },
  },
  fields: { flex: 1, width: "100%" },
  nameRow: {
    alignItems: "flex-end",
    [theme.fn.smallerThan("xs")]: { alignItems: "stretch", flexDirection: "column" },
  },
  actionRow: {
    justifyContent: "space-between",
    [theme.fn.smallerThan("xs")]: { alignItems: "stretch", flexDirection: "column" },
  },
}));

export default function RecruitmentAdminPage() {
  const { classes } = useStyles();
  const [channels, setChannels] = useState<RecruitmentChannel[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const load = () => recruitmentService.listAdmin().then(setChannels).catch(toast.axiosError);

  useEffect(() => {
    load();
  }, []);

  const add = async () => {
    if (!file || !name.trim()) {
      showNotification({ color: "yellow", title: "信息不完整", message: "请填写渠道名称并选择二维码图片。" });
      return;
    }

    setSaving(true);
    try {
      await recruitmentService.create(file, name, description, true);
      setName("");
      setDescription("");
      setFile(null);
      await load();
      showNotification({ color: "green", title: "新增成功", message: "二维码已发布到招新页面。" });
    } catch (error) {
      toast.axiosError(error);
    } finally {
      setSaving(false);
    }
  };

  const change = (id: string, patch: Partial<RecruitmentChannel>) => {
    setChannels((items) => items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const save = async (channel: RecruitmentChannel) => {
    try {
      await recruitmentService.update(channel);
      await load();
      showNotification({ color: "green", title: "保存成功", message: `${channel.name} 已更新。` });
    } catch (error) {
      toast.axiosError(error);
    }
  };

  const move = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= channels.length) return;

    const next = [...channels];
    [next[index], next[target]] = [next[target], next[index]];
    next.forEach((item, order) => { item.order = order; });
    setChannels(next);

    try {
      for (const channel of next) {
        await recruitmentService.update(channel);
      }
      await load();
    } catch (error) {
      toast.axiosError(error);
      await load();
    }
  };

  return (
    <>
      <Meta title="招新二维码管理" />
      <Title order={2}>招新二维码管理</Title>
      <Text color="dimmed" mt={6}>
        仅主管理员可以维护。支持 QQ 群、钉钉群、报名群等多张二维码；没有启用的项目时，招新页会自动显示“敬请期待”。
      </Text>

      <Paper withBorder p="lg" mt="xl">
        <Title order={4}>新增二维码</Title>
        <SimpleGrid cols={2} mt="md" breakpoints={[{ maxWidth: "sm", cols: 1 }]}>
          <TextInput label="渠道名称" placeholder="例如：2026 招新 QQ 群" value={name} onChange={(event) => setName(event.currentTarget.value)} />
          <Textarea label="简短说明" placeholder="例如：扫码加入后请修改群昵称" value={description} onChange={(event) => setDescription(event.currentTarget.value)} autosize minRows={1} maxRows={3} />
        </SimpleGrid>
        <Group mt="md">
          <FileButton onChange={setFile} accept="image/png,image/jpeg,image/webp">
            {(props) => <Button {...props} variant="light" leftIcon={<TbPhoto />}>{file?.name || "选择二维码图片"}</Button>}
          </FileButton>
          <Button loading={saving} leftIcon={<TbPlus />} onClick={add}>新增渠道</Button>
        </Group>
      </Paper>

      <Stack mt="xl">
        {channels.length === 0 && (
          <Paper withBorder p="xl">
            <Text align="center" color="dimmed">尚未配置二维码，公开招新页将显示“敬请期待”。</Text>
          </Paper>
        )}

        {channels.map((channel, index) => (
          <Paper withBorder p="lg" key={channel.id}>
            <Group className={classes.channelLayout}>
              <Image src={channel.imageUrl} alt={`${channel.name}二维码`} width={144} height={144} fit="contain" className={classes.qrImage} withPlaceholder />
              <Stack spacing="sm" className={classes.fields}>
                <Group position="apart" className={classes.nameRow}>
                  <TextInput sx={{ flex: 1 }} label="渠道名称" value={channel.name} onChange={(event) => change(channel.id, { name: event.currentTarget.value })} />
                  <Switch label="公开显示" checked={Boolean(channel.enabled)} onChange={(event) => change(channel.id, { enabled: event.currentTarget.checked })} />
                </Group>
                <Textarea label="简短说明" value={channel.description} onChange={(event) => change(channel.id, { description: event.currentTarget.value })} autosize minRows={2} maxRows={4} />
                <Group className={classes.actionRow}>
                  <Group>
                    <Button compact onClick={() => save(channel)}>保存</Button>
                    <FileButton
                      accept="image/png,image/jpeg,image/webp"
                      onChange={async (nextFile) => {
                        if (!nextFile) return;
                        try {
                          await recruitmentService.replaceImage(channel.id, nextFile);
                          await load();
                          showNotification({ color: "green", title: "替换成功", message: `${channel.name} 的二维码已更新。` });
                        } catch (error) {
                          toast.axiosError(error);
                        }
                      }}
                    >
                      {(props) => <Button {...props} compact variant="light">替换图片</Button>}
                    </FileButton>
                  </Group>
                  <Group spacing={5}>
                    <ActionIcon title="上移" disabled={index === 0} onClick={() => move(index, -1)}><TbArrowUp /></ActionIcon>
                    <ActionIcon title="下移" disabled={index === channels.length - 1} onClick={() => move(index, 1)}><TbArrowDown /></ActionIcon>
                    <ActionIcon
                      title="删除"
                      color="red"
                      onClick={async () => {
                        if (!window.confirm(`确定删除 ${channel.name} 吗？`)) return;
                        try {
                          await recruitmentService.remove(channel.id);
                          await load();
                        } catch (error) {
                          toast.axiosError(error);
                        }
                      }}
                    >
                      <TbTrash />
                    </ActionIcon>
                  </Group>
                </Group>
              </Stack>
            </Group>
          </Paper>
        ))}
      </Stack>
    </>
  );
}

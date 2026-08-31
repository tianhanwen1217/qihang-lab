import {
  Badge,
  Alert,
  Button,
  Group,
  Paper,
  Progress,
  SimpleGrid,
  Skeleton,
  Text,
  Title,
  createStyles,
} from "@mantine/core";
import moment from "moment";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  TbClock,
  TbDatabase,
  TbDownload,
  TbFiles,
  TbSettings,
  TbServer,
  TbQrcode,
  TbUpload,
  TbUsers,
} from "react-icons/tb";
import Meta from "../../components/Meta";
import shareService from "../../services/share.service";
import storageService from "../../services/storage.service";
import userService from "../../services/user.service";
import { MyShare } from "../../types/share.type";
import User from "../../types/user.type";
import { StorageStats } from "../../types/storage.type";
import { byteToHumanSizeString } from "../../utils/fileSize.util";
import toast from "../../utils/toast.util";

const useStyles = createStyles(() => ({
  stat: {
    padding: 20,
    border: "1px solid var(--qh-border)",
    background: "var(--qh-surface-raised)",
  },
  shortcut: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: 18,
    border: "1px solid var(--qh-border)",
    transition: "transform .18s ease,border-color .18s ease",
    "&:hover": { transform: "translateY(-2px)", borderColor: "var(--qh-brand)" },
  },
}));

const Admin = () => {
  const { classes } = useStyles();
  const [shares, setShares] = useState<MyShare[]>();
  const [users, setUsers] = useState<User[]>();
  const [storage, setStorage] = useState<StorageStats>();

  useEffect(() => {
    Promise.all([shareService.list(), userService.list()])
      .then(([shareList, userList]) => { setShares(shareList); setUsers(userList); })
      .catch(toast.axiosError);
    storageService.getStats().then(setStorage).catch(() => undefined);
  }, []);

  const stats = useMemo(() => {
    const list = shares || [];
    const active = list.filter((share) => !share.contentDeletedAt && (moment(share.expiration).unix() === 0 || moment(share.expiration).isAfter()));
    const expiring = active.filter((share) => moment(share.expiration).unix() !== 0 && moment(share.expiration).diff(moment(), "days", true) <= 3);
    return {
      active: active.length,
      expiring: expiring.length,
      history: list.filter((share) => !!share.contentDeletedAt || (moment(share.expiration).unix() !== 0 && moment(share.expiration).isBefore())).length,
      downloads: list.reduce((sum, share) => sum + (share.files || []).reduce((n: number, file: any) => n + (file.views || 0), 0), 0),
    };
  }, [shares]);

  const loading = !shares || !users;
  const cards = [
    { label: "有效资料包", value: stats.active, icon: TbFiles, color: "#35c9ff" },
    { label: "三天内到期", value: stats.expiring, icon: TbClock, color: "#ffd43b" },
    { label: "历史记录", value: stats.history, icon: TbDatabase, color: "#adb5bd" },
    { label: "累计文件下载", value: stats.downloads, icon: TbDownload, color: "#38d9a9" },
    { label: "有效副管理员", value: (users || []).filter((user) => !user.isAdmin && user.isActive).length, icon: TbUsers, color: "#b197fc" },
  ];

  return (
    <>
      <Meta title="主管理工作台" />
      <Group position="apart" mb="xl">
        <div><Title order={2}>主管理工作台</Title><Text color="dimmed" mt={5}>快速了解资料库状态，并进入常用管理功能。</Text></div>
        <Button component={Link} href="/upload" leftIcon={<TbUpload />}>上传资料包</Button>
      </Group>

      <SimpleGrid cols={5} spacing="md" breakpoints={[{ maxWidth: "md", cols: 3 }, { maxWidth: "xs", cols: 2 }]}>
        {loading ? [0,1,2,3,4].map((key) => <Skeleton key={key} height={108} radius="md" />) : cards.map((card) => (
          <Paper key={card.label} className={classes.stat} radius="md">
            <Group position="apart"><Text size="sm" color="dimmed">{card.label}</Text><card.icon size={21} color={card.color} /></Group>
            <Text mt="sm" size={28} weight={850}>{card.value}</Text>
          </Paper>
        ))}
      </SimpleGrid>

      <Paper withBorder p="lg" mt="xl">
        <Group position="apart" align="flex-start">
          <Group spacing="sm">
            <TbServer size={25} color="var(--qh-brand)" />
            <div>
              <Text weight={750}>服务器存储空间</Text>
              <Text size="xs" color="dimmed">上传文件、资料包 ZIP、数据库与系统文件共同使用这块磁盘</Text>
            </div>
          </Group>
          <Text weight={800}>{storage ? `${storage.usagePercent}%` : "读取中"}</Text>
        </Group>
        <Progress
          mt="md"
          size="lg"
          radius="xl"
          value={storage?.usagePercent || 0}
          color={!storage ? "gray" : storage.usagePercent >= 85 ? "red" : storage.usagePercent >= 70 ? "orange" : "qihang"}
          animate={!storage}
        />
        <Group position="apart" mt="xs">
          <Text size="sm" color="dimmed">已使用 {storage ? byteToHumanSizeString(storage.used) : "—"}</Text>
          <Text size="sm" color="dimmed">可用 {storage ? byteToHumanSizeString(storage.available) : "—"} / 共 {storage ? byteToHumanSizeString(storage.total) : "—"}</Text>
        </Group>
        {storage && storage.usagePercent >= 70 && (
          <Alert mt="md" color={storage.usagePercent >= 85 ? "red" : "orange"} title={storage.usagePercent >= 85 ? "存储空间严重不足" : "存储空间即将不足"}>
            {storage.usagePercent >= 85
              ? "请暂停上传大文件，并清理过期资料包或旧备份。"
              : "建议检查即将过期的资料包，并预留至少 4 GB 空间给上传和 ZIP 打包。"}
          </Alert>
        )}
      </Paper>

      <Title order={4} mt={36} mb="md">常用入口</Title>
      <SimpleGrid cols={4} breakpoints={[{ maxWidth: "md", cols: 2 }, { maxWidth: "sm", cols: 1 }]}>
        {[
          { href: "/admin/shares", title: "全部资料包与链接", detail: "查看主副管理员的上传和链接历史", icon: TbFiles },
          { href: "/admin/users", title: "副管理员账号", detail: "创建、修改或停用副管理员", icon: TbUsers },
          { href: "/admin/config/general", title: "网站配置", detail: "调整容量、期限和基础设置", icon: TbSettings },
          { href: "/admin/recruitment", title: "招新二维码", detail: "维护QQ群、钉钉群等招新入口", icon: TbQrcode },
        ].map((item) => (
          <Paper key={item.href} component={Link} href={item.href} className={classes.shortcut} radius="md">
            <item.icon size={28} color="#36c5ff" />
            <div><Text weight={750}>{item.title}</Text><Text size="xs" color="dimmed" mt={3}>{item.detail}</Text></div>
          </Paper>
        ))}
      </SimpleGrid>

      {stats.expiring > 0 && (
        <Paper withBorder p="md" mt="xl"><Group position="apart"><Group><Badge color="yellow">提醒</Badge><Text size="sm">有 {stats.expiring} 个资料包将在三天内到期。</Text></Group><Button component={Link} href="/admin/shares" compact variant="light">查看记录</Button></Group></Paper>
      )}
    </>
  );
};

export default Admin;

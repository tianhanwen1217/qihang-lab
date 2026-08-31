import {
  ActionIcon,
  Badge,
  Group,
  Paper,
  Stack,
  Text,
  Tooltip,
  createStyles,
} from "@mantine/core";
import { useClipboard } from "@mantine/hooks";
import { useModals } from "@mantine/modals";
import moment from "moment";
import {
  TbCopy,
  TbDownload,
  TbExternalLink,
  TbFiles,
  TbLink,
  TbSettings,
  TbTrash,
} from "react-icons/tb";
import { FileMetaData } from "../../types/File.type";
import { MyShare } from "../../types/share.type";
import { byteToHumanSizeString } from "../../utils/fileSize.util";
import toast from "../../utils/toast.util";
import showFileAccessModal from "./showFileAccessModal";

const useStyles = createStyles((theme) => ({
  package: {
    padding: 22,
    border: "1px solid rgba(76,154,226,.16)",
    background: theme.colorScheme === "dark" ? "rgba(7,20,41,.9)" : "#fff",
    transition: "border-color .2s ease,transform .2s ease",
    "&:hover": {
      borderColor: "rgba(41,200,255,.32)",
      transform: "translateY(-1px)",
    },
    [theme.fn.smallerThan("sm")]: {
      padding: 16,
      "&:hover": { transform: "none" },
    },
  },
  file: {
    padding: "13px 14px",
    border: "1px solid rgba(76,154,226,.1)",
    borderRadius: 10,
    background:
      theme.colorScheme === "dark"
        ? "rgba(17,37,65,.58)"
        : theme.colors.gray[0],
    [theme.fn.smallerThan("sm")]: {
      "& .qihang-file-actions": { marginTop: 10, justifyContent: "flex-start" },
    },
  },
  link: {
    maxWidth: 430,
    color: theme.colorScheme === "dark" ? "#83d9ff" : theme.colors.blue[7],
    fontFamily: "ui-monospace,SFMono-Regular,Consolas,monospace",
    fontSize: 12,
  },
  packageLink: {
    marginTop: 18,
    padding: "12px 14px",
    borderRadius: 10,
    border: "1px solid rgba(49,191,255,.24)",
    background:
      theme.colorScheme === "dark"
        ? "rgba(24,128,190,.12)"
        : "rgba(49,191,255,.07)",
  },
}));

const isExpired = (share: MyShare) =>
  !!share.contentDeletedAt ||
  (moment(share.expiration).unix() !== 0 &&
    moment(share.expiration).isBefore());

const linkStatus = (share: MyShare, file: FileMetaData) => {
  if (isExpired(share)) return { label: "已失效", color: "gray" };
  if (file.linkEnabled === false) return { label: "已禁用", color: "red" };
  if (
    file.linkExpiresAt &&
    moment(file.linkExpiresAt).diff(moment(), "days", true) <= 3
  )
    return { label: "即将过期", color: "yellow" };
  return file.visibility === "PUBLIC"
    ? { label: "公开", color: "cyan" }
    : { label: "仅链接", color: "orange" };
};

const PackageHistoryList = ({
  shares,
  reload,
  onDeletePackage,
  onDeleteFile,
}: {
  shares: MyShare[];
  reload: () => void;
  onDeletePackage: (share: MyShare) => void;
  onDeleteFile?: (share: MyShare, file: FileMetaData) => void;
}) => {
  const { classes } = useStyles();
  const clipboard = useClipboard();
  const modals = useModals();

  const copyFileLink = (token?: string) => {
    if (!token) return;
    clipboard.copy(`${window.location.origin}/f/${token}`);
    toast.success("独立链接已复制");
  };

  const copyPackageLink = (shareId: string) => {
    clipboard.copy(`${window.location.origin}/s/${shareId}`);
    toast.success("整个资料包链接已复制");
  };

  return (
    <Stack spacing="md">
      {shares.map((share) => {
        const expired = isExpired(share);
        const files = share.files as FileMetaData[];
        return (
          <Paper key={share.id} className={classes.package} radius="md">
            <Group position="apart" align="flex-start" noWrap>
              <Group noWrap align="flex-start" sx={{ minWidth: 0 }}>
                <TbFiles size={25} color="#31bfff" />
                <div style={{ minWidth: 0 }}>
                  <Group spacing="xs">
                    <Text weight={800} size="lg" lineClamp={1}>
                      {share.name ||
                        (files.length === 1 ? files[0].name : "未命名资料包")}
                    </Text>
                    <Badge color={expired ? "gray" : "teal"} variant="light">
                      {expired ? "已过期 · 仅保留记录" : "有效"}
                    </Badge>
                  </Group>
                  <Text
                    color="dimmed"
                    size="sm"
                    mt={5}
                    sx={{ whiteSpace: "pre-wrap" }}
                  >
                    {share.description?.trim() || "未填写资料包说明"}
                  </Text>
                  <Group spacing="xs" mt={8}>
                    {share.creator?.username && (
                      <Text size="xs" color="dimmed">
                        上传者 {share.creator.username}
                      </Text>
                    )}
                    <Text size="xs" color="dimmed">
                      {files.length} 个文件
                    </Text>
                    <Text size="xs" color="dimmed">
                      {byteToHumanSizeString(
                        share.size ||
                          files.reduce(
                            (sum, file) => sum + parseInt(file.size),
                            0,
                          ),
                      )}
                    </Text>
                    <Text size="xs" color="dimmed">
                      上传于{" "}
                      {moment(share.createdAt).format("YYYY-MM-DD HH:mm")}
                    </Text>
                    <Text size="xs" color="dimmed">
                      {moment(share.expiration).unix() === 0
                        ? "永久保留"
                        : `到期 ${moment(share.expiration).format("YYYY-MM-DD HH:mm")}`}
                    </Text>
                  </Group>
                </div>
              </Group>
              <Tooltip label="删除整个资料包">
                <ActionIcon
                  color="red"
                  variant="light"
                  onClick={() => onDeletePackage(share)}
                >
                  <TbTrash />
                </ActionIcon>
              </Tooltip>
            </Group>

            <div className={classes.packageLink}>
              <Group position="apart" spacing="xs" noWrap>
                <div style={{ minWidth: 0 }}>
                  <Text size="xs" weight={700} color="dimmed">
                    整个资料包分享链接
                  </Text>
                  <Group spacing={5} mt={4} noWrap>
                    <TbLink size={15} color="#31bfff" />
                    <Text className={classes.link} lineClamp={1}>
                      /s/{share.id}
                    </Text>
                  </Group>
                </div>
                {!expired && (
                  <Group spacing={5} noWrap>
                    <Tooltip label="复制整个资料包链接">
                      <ActionIcon
                        color="cyan"
                        variant="light"
                        onClick={() => copyPackageLink(share.id)}
                      >
                        <TbCopy />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip label="打开整个资料包">
                      <ActionIcon
                        component="a"
                        href={`/s/${share.id}`}
                        target="_blank"
                        color="cyan"
                        variant="light"
                      >
                        <TbExternalLink />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                )}
              </Group>
            </div>

            <Stack mt="lg" spacing="xs">
              {files.map((file) => (
                <div key={file.id} className={classes.file}>
                  <Group
                    position="apart"
                    align="flex-start"
                    sx={(theme) => ({
                      [theme.fn.smallerThan("sm")]: { display: "block" },
                    })}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <Group spacing="xs">
                        <Text weight={650} lineClamp={1}>
                          {file.name}
                        </Text>
                        <Badge size="xs" color={linkStatus(share, file).color}>
                          {linkStatus(share, file).label}
                        </Badge>
                        {file.passwordProtected && (
                          <Badge size="xs" color="violet">
                            有密码
                          </Badge>
                        )}
                      </Group>
                      <Text size="xs" color="dimmed" mt={3}>
                        {byteToHumanSizeString(parseInt(file.size))} · 下载{" "}
                        {file.views ?? 0} 次
                      </Text>
                      {file.accessToken && (
                        <Group spacing={5} mt={7} noWrap>
                          <TbLink size={14} color="#55cfff" />
                          <Text className={classes.link} lineClamp={1}>
                            /f/{file.accessToken}
                          </Text>
                          <ActionIcon
                            size="sm"
                            variant="subtle"
                            onClick={() => copyFileLink(file.accessToken)}
                            title="复制独立链接"
                          >
                            <TbCopy size={14} />
                          </ActionIcon>
                          {!expired && file.linkEnabled !== false && (
                            <ActionIcon
                              component="a"
                              href={`/f/${file.accessToken}`}
                              target="_blank"
                              size="sm"
                              variant="subtle"
                              title="打开链接"
                            >
                              <TbExternalLink size={14} />
                            </ActionIcon>
                          )}
                        </Group>
                      )}
                      {file.linkExpiresAt && !expired && (
                        <Text size="xs" color="dimmed" mt={4}>
                          链接有效至{" "}
                          {moment(file.linkExpiresAt).format(
                            "YYYY-MM-DD HH:mm",
                          )}
                        </Text>
                      )}
                    </div>
                    {!expired && (
                      <Group spacing={5} noWrap className="qihang-file-actions">
                        <ActionIcon
                          variant="light"
                          color="cyan"
                          title="分享设置"
                          onClick={() =>
                            showFileAccessModal(
                              modals,
                              share.id,
                              file,
                              share.expiration,
                              reload,
                            )
                          }
                        >
                          <TbSettings />
                        </ActionIcon>
                        <ActionIcon
                          component="a"
                          href={`/api/shares/${share.id}/files/${file.id}`}
                          variant="light"
                          color="green"
                          title="下载"
                        >
                          <TbDownload />
                        </ActionIcon>
                        {onDeleteFile && (
                          <ActionIcon
                            variant="light"
                            color="red"
                            title="删除文件"
                            onClick={() => onDeleteFile(share, file)}
                          >
                            <TbTrash />
                          </ActionIcon>
                        )}
                      </Group>
                    )}
                  </Group>
                </div>
              ))}
            </Stack>
          </Paper>
        );
      })}
    </Stack>
  );
};

export default PackageHistoryList;

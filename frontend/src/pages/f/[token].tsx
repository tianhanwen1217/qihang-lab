import {
  Alert,
  Badge,
  Button,
  Center,
  Group,
  Loader,
  Paper,
  PasswordInput,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import mime from "mime-types";
import moment from "moment";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { TbDownload, TbLock, TbShip, TbUser } from "react-icons/tb";
import Meta from "../../components/Meta";
import publicFileService from "../../services/publicFile.service";
import { PublicFile } from "../../types/publicFile.type";
import { byteToHumanSizeString } from "../../utils/fileSize.util";

const FileAccessPage = () => {
  const router = useRouter();
  const token = router.query.token as string | undefined;
  const [file, setFile] = useState<PublicFile>();
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [unlockError, setUnlockError] = useState("");
  const [unlocking, setUnlocking] = useState(false);

  useEffect(() => {
    if (!token) return;
    publicFileService
      .get(token)
      .then((value) => {
        setFile(value);
        setUnlocked(value.visibility === "PUBLIC" || !value.passwordProtected);
      })
      .catch(() => setLoadError("文件不存在、已过期或分享链接已关闭。"))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading)
    return (
      <Center mih={460}>
        <Loader color="cyan" />
      </Center>
    );

  if (!file || loadError)
    return (
      <Center mih={460}>
        <Alert color="red" title="无法打开文件">
          {loadError}
        </Alert>
      </Center>
    );

  const contentUrl = publicFileService.contentUrl(file.token, false);
  const mimeType = mime.contentType(file.name) || "";
  const previewable =
    mimeType.startsWith("image/") ||
    mimeType.startsWith("video/") ||
    mimeType.startsWith("audio/") ||
    mimeType === "application/pdf";

  return (
    <>
      <Meta title={file.name} />
      <Head>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <Stack spacing="lg" maw={920} mx="auto">
        <Paper p="xl" radius="md" withBorder>
          <Group position="apart" align="flex-start">
            <Stack spacing={7} sx={{ minWidth: 0 }}>
              <Group spacing="xs">
                <TbShip color="#29c8ff" />
                <Badge color={file.visibility === "PUBLIC" ? "cyan" : "orange"}>
                  {file.visibility === "PUBLIC" ? "公开资料" : "仅链接可见"}
                </Badge>
              </Group>
              <Title order={2} sx={{ wordBreak: "break-word" }}>
                {file.name}
              </Title>
              {file.description && (
                <Text color="dimmed">{file.description}</Text>
              )}
              <Group spacing="lg" mt="xs">
                <Text size="sm" color="dimmed">
                  {byteToHumanSizeString(parseInt(file.size))}
                </Text>
                <Text size="sm" color="dimmed">
                  <TbUser size={14} /> {file.uploader}
                </Text>
                <Text size="sm" color="dimmed">
                  {moment(file.createdAt).format("YYYY-MM-DD HH:mm")}
                </Text>
              </Group>
            </Stack>
          </Group>
        </Paper>

        {!unlocked ? (
          <Paper p="xl" radius="md" withBorder>
            <Stack maw={440} mx="auto">
              <Center>
                <TbLock size={32} color="#ff9d16" />
              </Center>
              <Text align="center" weight={700}>
                这个分享设置了访问密码
              </Text>
              <PasswordInput
                label="分享密码"
                value={password}
                onChange={(event) => setPassword(event.currentTarget.value)}
              />
              {unlockError && <Alert color="red">{unlockError}</Alert>}
              <Button
                loading={unlocking}
                disabled={!password}
                onClick={async () => {
                  setUnlockError("");
                  setUnlocking(true);
                  try {
                    await publicFileService.unlock(file.token, password);
                    setUnlocked(true);
                  } catch {
                    setUnlockError("密码不正确，请重新输入。");
                  } finally {
                    setUnlocking(false);
                  }
                }}
              >
                解锁文件
              </Button>
            </Stack>
          </Paper>
        ) : (
          <>
            {previewable && (
              <Paper p="md" radius="md" withBorder>
                {mimeType.startsWith("image/") && (
                  <img
                    src={contentUrl}
                    alt={file.name}
                    style={{
                      display: "block",
                      maxWidth: "100%",
                      margin: "auto",
                    }}
                  />
                )}
                {mimeType.startsWith("video/") && (
                  <video src={contentUrl} controls style={{ width: "100%" }} />
                )}
                {mimeType.startsWith("audio/") && (
                  <audio src={contentUrl} controls style={{ width: "100%" }} />
                )}
                {mimeType === "application/pdf" && (
                  <iframe
                    src={contentUrl}
                    title={file.name}
                    style={{ width: "100%", height: "70vh", border: 0 }}
                  />
                )}
              </Paper>
            )}
            <Button
              component="a"
              href={publicFileService.contentUrl(file.token)}
              leftIcon={<TbDownload size={18} />}
              size="md"
              mx="auto"
            >
              下载文件
            </Button>
          </>
        )}
      </Stack>
    </>
  );
};

export default FileAccessPage;

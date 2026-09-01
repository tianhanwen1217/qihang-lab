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
import moment from "moment";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import {
  TbDownload,
  TbEye,
  TbLock,
  TbShip,
  TbStar,
  TbUser,
} from "react-icons/tb";
import Meta from "../../components/Meta";
import PublicFilePreview from "../../components/public/PublicFilePreview";
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
  const [starring, setStarring] = useState(false);
  const [starError, setStarError] = useState("");

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

  return (
    <>
      <Meta title={file.name} />
      <Head>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <Stack spacing="lg" maw={920} mx="auto">
        <Paper p="xl" radius="md" withBorder>
          <Group position="apart" align="flex-start" spacing="lg">
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
              <Group spacing="md" mt={3}>
                <Text size="sm" color="dimmed">
                  <TbEye size={15} /> {file.views ?? 0} 次浏览
                </Text>
                <Text size="sm" color="dimmed">
                  <TbDownload size={15} /> {file.downloads ?? 0} 次下载
                </Text>
                <Text size="sm" color="dimmed">
                  <TbStar size={15} /> {file.stars ?? 0} 个星标
                </Text>
              </Group>
            </Stack>
            {unlocked && (
              <Button
                variant="light"
                color="yellow"
                leftIcon={<TbStar size={18} />}
                loading={starring}
                onClick={async () => {
                  setStarError("");
                  setStarring(true);
                  try {
                    const result = await publicFileService.star(file.token);
                    setFile((current) =>
                      current ? { ...current, stars: result.stars } : current,
                    );
                  } catch {
                    setStarError("星标没有点亮，请稍后再试。");
                  } finally {
                    setStarring(false);
                  }
                }}
              >
                点亮星标 · {file.stars ?? 0}
              </Button>
            )}
          </Group>
          {starError && (
            <Alert color="orange" mt="md">
              {starError}
            </Alert>
          )}
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
            <PublicFilePreview file={file} />
            <Button
              component="a"
              href={publicFileService.contentUrl(file.token)}
              leftIcon={<TbDownload size={18} />}
              size="md"
              mx="auto"
              onClick={() =>
                setFile((current) =>
                  current
                    ? { ...current, downloads: (current.downloads ?? 0) + 1 }
                    : current,
                )
              }
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

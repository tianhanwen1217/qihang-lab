import {
  Badge,
  Button,
  Center,
  createStyles,
  Divider,
  Group,
  Pagination,
  Paper,
  SegmentedControl,
  Select,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import moment from "moment";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  TbChevronDown,
  TbDownload,
  TbFile,
  TbFiles,
  TbSearch,
  TbTrendingUp,
} from "react-icons/tb";
import publicFileService from "../../services/publicFile.service";
import {
  PublicFile,
  PublicPackage,
  PublicPackagePage,
} from "../../types/publicFile.type";
import { byteToHumanSizeString } from "../../utils/fileSize.util";

const useStyles = createStyles((theme) => ({
  toolbar: {
    marginTop: 34,
    padding: "14px 18px",
    border: "1px solid var(--qh-border)",
    borderRadius: 14,
    background: "var(--qh-surface-raised)",
    [theme.fn.smallerThan("sm")]: {
      position: "sticky",
      top: 76,
      zIndex: 30,
      padding: 10,
      marginLeft: -8,
      marginRight: -8,
      background: "var(--qh-surface-raised)",
      boxShadow: "0 10px 24px rgba(0,0,0,.08)",
    },
  },
  search: {
    flex: 1,
    minWidth: 220,
    input: {
      color: "var(--qh-text)",
      borderColor: "var(--qh-border)",
      background: "var(--qh-surface)",
      "&:focus": { borderColor: "var(--qh-brand)" },
    },
  },
  card: {
    position: "relative",
    padding: 24,
    color: "var(--qh-text)",
    border: "1px solid var(--qh-border)",
    borderRadius: 16,
    background: "var(--qh-surface-raised)",
    overflow: "hidden",
    contain: "layout paint style",
    contentVisibility: "auto",
    containIntrinsicSize: "360px",
    transition: "transform .2s ease,border-color .2s ease,box-shadow .2s ease",
    "&::before": {
      content: "\"\"",
      position: "absolute",
      inset: "0 0 auto",
      height: 2,
      background: "linear-gradient(90deg,var(--qh-brand),#e89a38,#ee6243)",
      opacity: 0,
      transition: "opacity .2s ease",
    },
    "@media (hover: hover)": { "&:hover": {
      transform: "translateY(-3px)",
      borderColor: "var(--qh-border-strong)",
      boxShadow: "var(--qh-shadow)",
      "&::before": { opacity: .72 },
    } },
    [theme.fn.smallerThan("sm")]: {
      padding: 18,
      "&:hover": { transform: "none" },
    },
    display: "flex",
    flexDirection: "column",
  },
  packageName: {
    color: "var(--qh-text)",
    fontSize: 19,
    fontWeight: 800,
    lineHeight: 1.35,
    wordBreak: "break-word",
  },
  description: {
    minHeight: 72,
    color: "var(--qh-muted)",
    lineHeight: 1.65,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
  filters: {
    marginTop: 10,
    display: "flex",
    gap: 10,
    alignItems: "center",
    [theme.fn.smallerThan("sm")]: {
      overflowX: "auto",
      paddingBottom: 2,
      scrollbarWidth: "none",
    },
  },
  cardBody: { flex: 1 },
  mobileActions: {
    [theme.fn.smallerThan("sm")]: {
      "& button, & a": { minHeight: 38, minWidth: 46 },
    },
  },
  fileRow: {
    padding: "9px 10px",
    borderRadius: 9,
    border: "1px solid var(--qh-border)",
    background: "var(--qh-surface-soft)",
    "& + &": { marginTop: 6 },
  },
  empty: {
    minHeight: 240,
    marginTop: 24,
    border: "1px dashed var(--qh-border-strong)",
    borderRadius: 14,
    background: "var(--qh-surface)",
  },
}));

const FileRow = ({ file }: { file: PublicFile }) => {
  const { classes } = useStyles();
  return (
    <Group className={classes.fileRow} position="apart" noWrap>
      <Group spacing="xs" noWrap sx={{ minWidth: 0 }}>
        <TbFile size={17} color="#67d4ff" />
        <div style={{ minWidth: 0 }}>
          <Text size="sm" weight={600} lineClamp={1} title={file.name}>
            {file.name}
          </Text>
          <Text size="xs" color="dimmed">
            {file.category} · {byteToHumanSizeString(parseInt(file.size))}
          </Text>
        </div>
      </Group>
      <Group spacing={4} noWrap className={classes.mobileActions}>
        <Button component={Link} href={`/f/${file.token}`} compact variant="subtle">
          详情
        </Button>
        <Button
          component="a"
          href={publicFileService.contentUrl(file.token)}
          compact
          variant="light"
          leftIcon={<TbDownload size={14} />}
        >
          下载
        </Button>
      </Group>
    </Group>
  );
};

const PackageCard = ({ item }: { item: PublicPackage }) => {
  const { classes } = useStyles();
  const [expanded, setExpanded] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [loadedFiles, setLoadedFiles] = useState(item.files);
  const [loadedPage, setLoadedPage] = useState(item.files.length >= item.fileCount ? 1 : 0);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [fileLoadError, setFileLoadError] = useState(false);
  const visibleFiles = expanded ? loadedFiles : item.files.slice(0, 3);
  const hasMoreFiles = loadedFiles.length < item.fileCount;

  const loadFiles = async (page: number) => {
    if (loadingFiles) return;
    setLoadingFiles(true);
    setFileLoadError(false);
    try {
      const result = await publicFileService.listPackageFiles(item.id, page);
      setLoadedFiles((current) => {
        const known = new Set(current.map((file) => file.token));
        return [...current, ...result.items.filter((file) => !known.has(file.token))];
      });
      setLoadedPage(page);
    } catch {
      setFileLoadError(true);
    } finally {
      setLoadingFiles(false);
    }
  };

  const toggleExpanded = () => {
    const opening = !expanded;
    setExpanded(opening);
    if (opening && loadedPage === 0) void loadFiles(1);
  };
  return (
    <Paper className={classes.card}>
      <Group position="apart" align="flex-start" noWrap>
        <Group spacing="sm" noWrap sx={{ minWidth: 0 }}>
          <TbFiles size={25} color="#67d4ff" />
          <Text className={classes.packageName} lineClamp={2}>
            {item.name}
          </Text>
        </Group>
        <Badge color="cyan" variant="light">
          {item.fileCount} 个文件
        </Badge>
      </Group>

      <div className={classes.cardBody}>
      <Text className={classes.description} mt="md" lineClamp={descriptionExpanded ? undefined : 4}>
        {item.description?.trim() || "上传者暂未填写资料说明"}
      </Text>
      {(item.description?.length || 0) > 110 && (
        <Button compact variant="subtle" px={0} onClick={() => setDescriptionExpanded((value) => !value)}>
          {descriptionExpanded ? "收起说明" : "展开完整说明"}
        </Button>
      )}
      <Group spacing="xs" mt="sm">
        <Text size="xs" color="dimmed">{item.uploader}</Text>
        <Text size="xs" color="dimmed">·</Text>
        <Text size="xs" color="dimmed">
          {byteToHumanSizeString(item.totalSize)}
        </Text>
        <Text size="xs" color="dimmed">· {moment(item.createdAt).fromNow()}</Text>
        <Text size="xs" color="dimmed">· 下载 {item.downloads} 次</Text>
      </Group>

      {item.downloadableAsZip && (
        <Button
          component="a"
          href={publicFileService.packageContentUrl(item.downloadId!)}
          mt="md"
          compact
          variant="gradient"
          gradient={{ from: "blue", to: "cyan" }}
          leftIcon={<TbDownload size={15} />}
        >
          下载整个资料包（ZIP）
        </Button>
      )}

      <Divider my="md" color="rgba(90,160,255,.1)" />
      <Stack spacing={0}>{visibleFiles.map((file) => <FileRow key={file.token} file={file} />)}</Stack>
      {expanded && fileLoadError && (
        <Button mt="sm" fullWidth compact color="orange" variant="light" onClick={() => void loadFiles(Math.max(1, loadedPage + 1))}>
          文件列表加载失败，点击重试
        </Button>
      )}
      {expanded && !fileLoadError && hasMoreFiles && loadedPage > 0 && (
        <Button mt="sm" fullWidth compact variant="light" loading={loadingFiles} onClick={() => void loadFiles(loadedPage + 1)}>
          再加载 60 个文件
        </Button>
      )}
      {item.fileCount > 3 && (
        <Button
          mt="sm"
          fullWidth
          compact
          variant="subtle"
          loading={expanded && loadingFiles && loadedPage === 0}
          rightIcon={
            <TbChevronDown
              size={16}
              style={{ transform: expanded ? "rotate(180deg)" : undefined, transition: "transform .2s ease" }}
            />
          }
          onClick={toggleExpanded}
        >
          {expanded ? "收起文件" : `查看全部 ${item.fileCount} 个文件`}
        </Button>
      )}
      </div>
    </Paper>
  );
};

const PublicFileLibrary = () => {
  const { classes } = useStyles();
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebouncedValue(search, 350);
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState("ALL");
  const [sort, setSort] = useState("LATEST");
  const [result, setResult] = useState<PublicPackagePage>();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const request = useRef(0);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const id = ++request.current;
    setLoading(true);
    setLoadError(false);
    publicFileService.listPackages(debouncedSearch, page, category, sort)
      .then((value) => id === request.current && setResult(value))
      .catch(() => id === request.current && setLoadError(true))
      .finally(() => id === request.current && setLoading(false));
  }, [debouncedSearch, page, category, sort, retryKey]);

  useEffect(() => setPage(1), [debouncedSearch, category, sort]);
  useEffect(() => {
    const focus = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", focus);
    return () => window.removeEventListener("keydown", focus);
  }, []);

  return (
    <>
      <Paper className={classes.toolbar}>
        <Group position="apart" noWrap>
          <TextInput
            ref={searchRef}
            className={classes.search}
            icon={<TbSearch size={17} />}
            placeholder="搜索资料包、说明或文件名"
            value={search}
            onChange={(event) => setSearch(event.currentTarget.value)}
          />
          <Text size="sm" color="dimmed" sx={{ whiteSpace: "nowrap" }}>
            {result?.total ?? 0} 个资料包
          </Text>
        </Group>
        <div className={classes.filters}>
          <SegmentedControl
            value={category}
            onChange={setCategory}
            data={[
              { label: "全部", value: "ALL" },
              { label: "文档", value: "DOCUMENT" },
              { label: "图片", value: "IMAGE" },
              { label: "代码", value: "CODE" },
              { label: "压缩包", value: "ARCHIVE" },
            ]}
            sx={{ flexShrink: 0 }}
          />
          <Select
            value={sort}
            onChange={(value) => setSort(value || "LATEST")}
            data={[
              { label: "最新上传", value: "LATEST" },
              { label: "下载最多", value: "POPULAR" },
            ]}
            icon={<TbTrendingUp size={15} />}
            styles={{ root: { width: 140, flexShrink: 0 } }}
          />
        </div>
      </Paper>

      {loading ? (
        <SimpleGrid mt={24} cols={2} spacing="lg" breakpoints={[{ maxWidth: "sm", cols: 1 }]}>
          {[0, 1, 2, 3].map((key) => (
            <Paper key={key} className={classes.card} mih={330}>
              <Group position="apart"><Skeleton height={24} width="55%" /><Skeleton height={22} width={72} /></Group>
              <Skeleton mt="xl" height={15} /><Skeleton mt={8} height={15} /><Skeleton mt={8} height={15} width="78%" />
              <Skeleton mt={28} height={52} /><Skeleton mt={8} height={52} />
            </Paper>
          ))}
        </SimpleGrid>
      ) : loadError ? (
        <Center className={classes.empty}>
          <Stack align="center">
            <Text weight={700}>资料库暂时加载失败</Text>
            <Button variant="light" onClick={() => setRetryKey((v) => v + 1)}>重新加载</Button>
          </Stack>
        </Center>
      ) : result?.items.length ? (
        <>
          <SimpleGrid mt={24} cols={2} spacing="lg" breakpoints={[{ maxWidth: "sm", cols: 1 }]}>
            {result.items.map((item) => <PackageCard key={item.id} item={item} />)}
          </SimpleGrid>
          {result.total > result.pageSize && (
            <Center mt={34}><Pagination value={page} onChange={setPage} total={Math.ceil(result.total / result.pageSize)} /></Center>
          )}
        </>
      ) : (
        <Center className={classes.empty}>
          <Stack align="center" spacing={6}>
            <TbFiles size={34} color="#4aaee8" />
            <Text weight={700}>{search ? "没有匹配的资料包" : "公开资料正在整理中"}</Text>
            <Text size="sm" color="dimmed">管理员上传并设为公开后，会显示在这里。</Text>
          </Stack>
        </Center>
      )}
    </>
  );
};

export default PublicFileLibrary;

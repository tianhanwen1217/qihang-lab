import {
  Alert,
  Center,
  Code,
  Group,
  Loader,
  Paper,
  ScrollArea,
  Stack,
  Text,
  createStyles,
} from "@mantine/core";
import mime from "mime-types";
import { useEffect, useMemo, useState } from "react";
import { TbCode, TbFileOff } from "react-icons/tb";
import publicFileService from "../../services/publicFile.service";
import { PublicFile } from "../../types/publicFile.type";
import { byteToHumanSizeString } from "../../utils/fileSize.util";

const MAX_TEXT_PREVIEW_BYTES = 1024 * 1024;
const MAX_RENDERED_LINES = 3000;

const textExtensions = new Set([
  "txt",
  "md",
  "markdown",
  "json",
  "jsonc",
  "yaml",
  "yml",
  "xml",
  "csv",
  "tsv",
  "js",
  "mjs",
  "cjs",
  "ts",
  "tsx",
  "jsx",
  "css",
  "scss",
  "less",
  "html",
  "htm",
  "vue",
  "svelte",
  "py",
  "java",
  "c",
  "cpp",
  "cc",
  "h",
  "hpp",
  "go",
  "rs",
  "php",
  "rb",
  "swift",
  "kt",
  "kts",
  "sh",
  "bash",
  "zsh",
  "ps1",
  "bat",
  "cmd",
  "sql",
  "prisma",
  "graphql",
  "toml",
  "ini",
  "conf",
  "env",
  "properties",
  "log",
  "dockerfile",
  "gitignore",
]);

const useStyles = createStyles((theme) => ({
  shell: {
    overflow: "hidden",
    borderColor: "var(--qh-border)",
    background: "var(--qh-surface-raised)",
  },
  header: {
    minHeight: 48,
    padding: "10px 14px",
    borderBottom: "1px solid var(--qh-border)",
    background: "var(--qh-surface-soft)",
  },
  media: {
    display: "block",
    maxWidth: "100%",
    maxHeight: "72vh",
    margin: "0 auto",
  },
  codeViewport: {
    maxHeight: "68vh",
    background: theme.colorScheme === "dark" ? "#07101f" : "#fffdf9",
  },
  codeTable: {
    width: "max-content",
    minWidth: "100%",
    borderCollapse: "collapse",
    fontFamily: "ui-monospace, SFMono-Regular, Consolas, monospace",
    fontSize: 13,
    lineHeight: 1.65,
  },
  lineNumber: {
    width: 1,
    padding: "0 14px",
    color: theme.colorScheme === "dark" ? "#64748b" : "#9aa4b2",
    textAlign: "right",
    userSelect: "none",
    verticalAlign: "top",
    borderRight: "1px solid var(--qh-border)",
  },
  line: {
    padding: "0 18px",
    color: "var(--qh-text)",
    whiteSpace: "pre",
    verticalAlign: "top",
  },
}));

const extensionOf = (name: string) => {
  const normalized = name.toLowerCase();
  const baseName = normalized.split("/").pop() || normalized;
  if (baseName === "dockerfile" || baseName === ".gitignore")
    return baseName.replace(/^\./, "");
  return baseName.includes(".") ? baseName.split(".").pop() || "" : "";
};

const PublicFilePreview = ({ file }: { file: PublicFile }) => {
  const { classes } = useStyles();
  const [textContent, setTextContent] = useState<string>();
  const [textLoading, setTextLoading] = useState(false);
  const [textError, setTextError] = useState(false);
  const mimeType = mime.contentType(file.name) || "";
  const extension = extensionOf(file.name);
  const isText = mimeType.startsWith("text/") || textExtensions.has(extension);
  const contentUrl = publicFileService.contentUrl(file.token, false);
  const fileSize = Number.parseInt(file.size, 10) || 0;

  useEffect(() => {
    if (!isText || fileSize > MAX_TEXT_PREVIEW_BYTES) return;
    let active = true;
    setTextLoading(true);
    setTextError(false);
    publicFileService
      .getTextContent(file.token)
      .then((value) => active && setTextContent(String(value)))
      .catch(() => active && setTextError(true))
      .finally(() => active && setTextLoading(false));
    return () => {
      active = false;
    };
  }, [file.token, fileSize, isText]);

  const lines = useMemo(
    () => (textContent ?? "").replace(/\r\n/g, "\n").split("\n"),
    [textContent],
  );
  const visibleLines = lines.slice(0, MAX_RENDERED_LINES);

  const header = (
    <Group className={classes.header} position="apart" spacing="xs" noWrap>
      <Group spacing="xs" noWrap sx={{ minWidth: 0 }}>
        <TbCode size={17} color="#31bfff" />
        <Text size="sm" weight={700} lineClamp={1} title={file.name}>
          {file.name}
        </Text>
      </Group>
      <Text size="xs" color="dimmed" sx={{ whiteSpace: "nowrap" }}>
        {byteToHumanSizeString(fileSize)}
      </Text>
    </Group>
  );

  if (mimeType.startsWith("image/")) {
    return (
      <Paper className={classes.shell} radius="md" withBorder>
        {header}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={classes.media} src={contentUrl} alt={file.name} />
      </Paper>
    );
  }

  if (mimeType.startsWith("video/")) {
    return (
      <Paper className={classes.shell} radius="md" withBorder>
        {header}
        <video className={classes.media} src={contentUrl} controls />
      </Paper>
    );
  }

  if (mimeType.startsWith("audio/")) {
    return (
      <Paper className={classes.shell} radius="md" withBorder>
        {header}
        <audio
          src={contentUrl}
          controls
          style={{ display: "block", width: "calc(100% - 32px)", margin: 24 }}
        />
      </Paper>
    );
  }

  if (mimeType === "application/pdf") {
    return (
      <Paper className={classes.shell} radius="md" withBorder>
        {header}
        <iframe
          src={contentUrl}
          title={file.name}
          style={{ display: "block", width: "100%", height: "72vh", border: 0 }}
        />
      </Paper>
    );
  }

  if (isText && fileSize > MAX_TEXT_PREVIEW_BYTES) {
    return (
      <Alert color="blue" icon={<TbFileOff />} title="文件内容较大">
        超过 1 MB 的文本文件暂不在线展开，请下载后查看，以免浏览器卡顿。
      </Alert>
    );
  }

  if (isText) {
    return (
      <Paper className={classes.shell} radius="md" withBorder>
        {header}
        {textLoading ? (
          <Center mih={180}>
            <Loader color="cyan" size="sm" />
          </Center>
        ) : textError ? (
          <Alert m="md" color="orange">
            文件内容暂时读取失败，仍可直接下载。
          </Alert>
        ) : (
          <>
            <ScrollArea className={classes.codeViewport} type="auto">
              <table className={classes.codeTable}>
                <tbody>
                  {visibleLines.map((line, index) => (
                    <tr key={index}>
                      <td className={classes.lineNumber}>{index + 1}</td>
                      <td className={classes.line}>
                        <Code color="transparent">{line || " "}</Code>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>
            {lines.length > MAX_RENDERED_LINES && (
              <Alert color="blue" radius={0}>
                文件共有 {lines.length} 行，在线预览仅显示前{" "}
                {MAX_RENDERED_LINES} 行。
              </Alert>
            )}
          </>
        )}
      </Paper>
    );
  }

  return (
    <Paper className={classes.shell} radius="md" withBorder>
      {header}
      <Center mih={180}>
        <Stack align="center" spacing={6} px="md">
          <TbFileOff size={32} color="#7f8da3" />
          <Text weight={700}>该格式暂不支持在线预览</Text>
          <Text size="sm" color="dimmed" align="center">
            文件仍然可以安全下载后查看。
          </Text>
        </Stack>
      </Center>
    </Paper>
  );
};

export default PublicFilePreview;

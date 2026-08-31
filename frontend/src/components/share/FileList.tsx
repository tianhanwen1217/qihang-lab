import {
  ActionIcon,
  Badge,
  Box,
  Group,
  Skeleton,
  Stack,
  Table,
  TextInput,
} from "@mantine/core";
import { useClipboard } from "@mantine/hooks";
import { useModals } from "@mantine/modals";
import { Dispatch, Fragment, SetStateAction, useEffect, useState } from "react";
import {
  TbCode,
  TbChevronRight,
  TbDownload,
  TbEye,
  TbFile,
  TbFileText,
  TbFileZip,
  TbFolder,
  TbFolderOpen,
  TbLink,
  TbPhoto,
} from "react-icons/tb";
import { FormattedMessage } from "react-intl";
import useTranslate from "../../hooks/useTranslate.hook";
import shareService from "../../services/share.service";
import { FileMetaData } from "../../types/File.type";
import { Share } from "../../types/share.type";
import { byteToHumanSizeString } from "../../utils/fileSize.util";
import toast from "../../utils/toast.util";
import TableSortIcon, { TableSort } from "../core/SortIcon";
import showFilePreviewModal from "./modals/showFilePreviewModal";
import {
  getFileBaseName,
  getFileListPath,
  getTopLevelFolder,
} from "../../utils/filePath.util";

const FileList = ({
  files,
  setShare,
  share,
  isLoading,
}: {
  files?: FileMetaData[];
  setShare: Dispatch<SetStateAction<Share | undefined>>;
  share: Share;
  isLoading: boolean;
}) => {
  const clipboard = useClipboard();
  const modals = useModals();
  const t = useTranslate();

  const [sort, setSort] = useState<TableSort>({
    property: "name",
    direction: "desc",
  });
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(),
  );

  const sortFiles = () => {
    if (files && sort.property) {
      const sortedFiles = files.sort((a: any, b: any) => {
        if (sort.direction === "asc") {
          return b[sort.property!].localeCompare(a[sort.property!], undefined, {
            numeric: true,
          });
        } else {
          return a[sort.property!].localeCompare(b[sort.property!], undefined, {
            numeric: true,
          });
        }
      });

      setShare({
        ...share,
        files: sortedFiles,
      });
    }
  };

  const copyFileLink = (file: FileMetaData) => {
    const link = `${window.location.origin}/api/shares/${
      share.id
    }/files/${file.id}`;

    if (window.isSecureContext) {
      clipboard.copy(link);
      toast.success(t("common.notify.copied-link"));
    } else {
      modals.openModal({
        title: t("share.modal.file-link"),
        children: (
          <Stack align="stretch">
            <TextInput variant="filled" value={link} />
          </Stack>
        ),
      });
    }
  };

  useEffect(sortFiles, [sort]);

  const getFilePresentation = (name: string) => {
    const extension = name.split(".").pop()?.toLowerCase() ?? "file";
    if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(extension))
      return { label: extension, icon: TbPhoto };
    if (["zip", "rar", "7z", "tar", "gz"].includes(extension))
      return { label: extension, icon: TbFileZip };
    if (
      ["js", "ts", "tsx", "jsx", "py", "c", "cpp", "java"].includes(extension)
    )
      return { label: extension, icon: TbCode };
    if (["pdf", "doc", "docx", "txt", "md", "ppt", "pptx"].includes(extension))
      return { label: extension, icon: TbFileText };
    return { label: extension, icon: TbFile };
  };

  const renderFileRow = (
    file: FileMetaData,
    displayName = file.name,
    nested = false,
  ) => {
    const presentation = getFilePresentation(file.name);
    const FileIcon = presentation.icon;
    return (
      <tr key={file.id}>
        <td style={{ paddingLeft: nested ? 54 : undefined }}>
          <Group spacing="sm" noWrap>
            <Badge
              variant="outline"
              color="cyan"
              leftSection={<FileIcon size={13} />}
              sx={{ textTransform: "uppercase" }}
            >
              {presentation.label}
            </Badge>
            <span>{displayName}</span>
          </Group>
        </td>
        <td>{byteToHumanSizeString(parseInt(file.size))}</td>
        <td>
          <Group position="right">
            {shareService.doesFileSupportPreview(file.name) && (
              <ActionIcon
                onClick={() => showFilePreviewModal(share.id, file, modals)}
                size={25}
              >
                <TbEye />
              </ActionIcon>
            )}
            {!share.hasPassword && (
              <ActionIcon size={25} onClick={() => copyFileLink(file)}>
                <TbLink />
              </ActionIcon>
            )}
            <ActionIcon
              size={25}
              onClick={async () => {
                await shareService.downloadFile(share.id, file.id);
              }}
            >
              <TbDownload />
            </ActionIcon>
          </Group>
        </td>
      </tr>
    );
  };

  const renderRows = () => {
    const groups: Array<{
      key: string;
      folder?: string;
      entries: FileMetaData[];
    }> = [];
    const folderIndexes = new Map<string, number>();

    files!.forEach((file, index) => {
      const folder = getTopLevelFolder(file);
      if (!folder) {
        groups.push({ key: `file-${file.id}-${index}`, entries: [file] });
        return;
      }
      const existingIndex = folderIndexes.get(folder);
      if (existingIndex === undefined) {
        folderIndexes.set(folder, groups.length);
        groups.push({ key: `folder-${folder}`, folder, entries: [file] });
      } else {
        groups[existingIndex].entries.push(file);
      }
    });

    return groups.map((group) => {
      if (!group.folder) return renderFileRow(group.entries[0]);
      const expanded = expandedFolders.has(group.folder);
      const totalSize = group.entries.reduce(
        (sum, file) => sum + parseInt(file.size),
        0,
      );
      return (
        <Fragment key={group.key}>
          <tr style={{ background: "rgba(22, 140, 255, 0.045)" }}>
            <td>
              <Group spacing="xs" noWrap>
                <ActionIcon
                  variant="subtle"
                  color="cyan"
                  onClick={() =>
                    setExpandedFolders((current) => {
                      const next = new Set(current);
                      next.has(group.folder!)
                        ? next.delete(group.folder!)
                        : next.add(group.folder!);
                      return next;
                    })
                  }
                  aria-label={expanded ? "收起文件夹" : "展开文件夹"}
                >
                  <TbChevronRight
                    style={{
                      transform: expanded ? "rotate(90deg)" : undefined,
                      transition: "transform 160ms ease",
                    }}
                  />
                </ActionIcon>
                {expanded ? <TbFolderOpen size={21} /> : <TbFolder size={21} />}
                <div>
                  <Box component="span" sx={{ fontWeight: 700 }}>
                    {group.folder}
                  </Box>
                  <Box sx={{ color: "dimmed", fontSize: 12 }}>
                    {group.entries.length} 个文件
                  </Box>
                </div>
              </Group>
            </td>
            <td>{byteToHumanSizeString(totalSize)}</td>
            <td></td>
          </tr>
          {expanded &&
            group.entries.map((file) =>
              renderFileRow(
                file,
                getFileListPath(file).slice(group.folder!.length + 1) ||
                  getFileBaseName(file.name),
                true,
              ),
            )}
        </Fragment>
      );
    });
  };

  return (
    <Box sx={{ display: "block", overflowX: "auto" }}>
      <Table>
        <thead>
          <tr>
            <th>
              <Group spacing="xs">
                <FormattedMessage id="share.table.name" />
                <TableSortIcon sort={sort} setSort={setSort} property="name" />
              </Group>
            </th>
            <th>
              <Group spacing="xs">
                <FormattedMessage id="share.table.size" />
                <TableSortIcon sort={sort} setSort={setSort} property="size" />
              </Group>
            </th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {isLoading
            ? skeletonRows
            : renderRows()}
        </tbody>
      </Table>
    </Box>
  );
};

const skeletonRows = [...Array(5)].map((c, i) => (
  <tr key={i}>
    <td>
      <Skeleton height={30} width={30} />
    </td>
    <td>
      <Skeleton height={14} />
    </td>
    <td>
      <Skeleton height={14} />
    </td>
    <td>
      <Skeleton height={25} width={25} />
    </td>
  </tr>
));

export default FileList;

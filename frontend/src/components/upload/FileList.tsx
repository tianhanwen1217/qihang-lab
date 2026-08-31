import { ActionIcon, Group, Table, Text, Tooltip } from "@mantine/core";
import { Fragment, useMemo, useState } from "react";
import {
  TbChevronRight,
  TbFolder,
  TbFolderOpen,
  TbRefresh,
  TbTrash,
} from "react-icons/tb";
import { GrUndo } from "react-icons/gr";
import { FileListItem } from "../../types/File.type";
import { byteToHumanSizeString } from "../../utils/fileSize.util";
import UploadProgressIndicator from "./UploadProgressIndicator";
import { FormattedMessage } from "react-intl";
import {
  getFileListPath,
  getTopLevelFolder,
} from "../../utils/filePath.util";

const FileListRow = ({
  file,
  onRemove,
  onRestore,
  onRetry,
  removing = false,
  actionsDisabled = false,
  allowFailedRemoval = false,
  displayName,
  nested = false,
}: {
  file: FileListItem;
  onRemove?: () => void;
  onRestore?: () => void;
  onRetry?: () => void;
  removing?: boolean;
  actionsDisabled?: boolean;
  allowFailedRemoval?: boolean;
  displayName?: string;
  nested?: boolean;
}) => {
  {
    const uploadable = "uploadingProgress" in file;
    const uploading = uploadable && file.uploadingProgress !== 0;
    const removable = uploadable
      ? file.uploadingProgress === 0 || (allowFailedRemoval && file.uploadingProgress < 0)
      : onRemove && !file.deleted;
    const restorable = onRestore && !uploadable && !!file.deleted; // maybe undefined, force boolean
    const deleted = !uploadable && !!file.deleted;

    return (
      <tr
        style={{
          color: deleted ? "rgba(120, 120, 120, 0.5)" : "inherit",
          textDecoration: deleted ? "line-through" : "none",
        }}
      >
        <td style={{ paddingLeft: nested ? 54 : undefined }}>
          <Text size="sm" weight={600}>{displayName || file.name}</Text>
          {uploadable && file.uploadingProgress < 0 && (
            <Text size="xs" color="red" mt={2}>{file.uploadError || "上传中断，可直接重试这个文件"}</Text>
          )}
        </td>
        <td>{byteToHumanSizeString(+file.size)}</td>
        <td>
          <Group position="right" spacing={6} noWrap>
            {removable && (
              <Tooltip label={uploadable && file.uploadingProgress < 0 ? "删除失败文件" : "删除文件"}>
                <ActionIcon
                  color="red"
                  variant="light"
                  size={25}
                  onClick={onRemove}
                  loading={removing}
                  disabled={actionsDisabled && !(uploadable && file.uploadingProgress < 0)}
                >
                  <TbTrash />
                </ActionIcon>
              </Tooltip>
            )}
            {uploading && <UploadProgressIndicator progress={file.uploadingProgress} />}
            {uploadable && file.uploadingProgress < 0 && onRetry && (
              <Tooltip label="从中断处重试">
                <ActionIcon color="orange" variant="light" onClick={onRetry} disabled={actionsDisabled || removing}><TbRefresh /></ActionIcon>
              </Tooltip>
            )}
            {restorable && (
              <ActionIcon
                color="primary"
                variant="light"
                size={25}
                onClick={onRestore}
              >
                <GrUndo />
              </ActionIcon>
            )}
          </Group>
        </td>
      </tr>
    );
  }
};

const FileList = <T extends FileListItem = FileListItem>({
  files,
  setFiles,
  onRetry,
  onRemove,
  actionsDisabled = false,
}: {
  files: T[];
  setFiles: (files: T[]) => void;
  onRetry?: (index: number) => void;
  onRemove?: (index: number) => void | Promise<void>;
  actionsDisabled?: boolean;
}) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(),
  );

  const remove = (index: number) => {
    if (onRemove) {
      void onRemove(index);
      return;
    }

    const file = files[index];

    if ("uploadingProgress" in file) {
      files.splice(index, 1);
    } else {
      files[index] = { ...file, deleted: true };
    }

    setFiles([...files]);
  };

  const restore = (index: number) => {
    const file = files[index];

    if ("uploadingProgress" in file) {
      return;
    } else {
      files[index] = { ...file, deleted: false };
    }

    setFiles([...files]);
  };

  const groups = useMemo(() => {
    const result: Array<{
      key: string;
      folder?: string;
      entries: Array<{ file: T; index: number }>;
    }> = [];
    const folderIndexes = new Map<string, number>();

    files.forEach((file, index) => {
      const folder = getTopLevelFolder(file);
      if (!folder) {
        result.push({ key: `file-${index}`, entries: [{ file, index }] });
        return;
      }
      const existingIndex = folderIndexes.get(folder);
      if (existingIndex === undefined) {
        folderIndexes.set(folder, result.length);
        result.push({ key: `folder-${folder}`, folder, entries: [{ file, index }] });
      } else {
        result[existingIndex].entries.push({ file, index });
      }
    });
    return result;
  }, [files]);

  const removeFolder = async (entries: Array<{ file: T; index: number }>) => {
    if (
      entries.every(
        ({ file }) =>
          "uploadingProgress" in file && file.uploadingProgress === 0,
      )
    ) {
      const targets = new Set(entries.map(({ file }) => file));
      setFiles(files.filter((file) => !targets.has(file)));
      return;
    }
    for (const { index } of [...entries].reverse()) await remove(index);
  };

  const toggleFolder = (folder: string) => {
    setExpandedFolders((current) => {
      const next = new Set(current);
      next.has(folder) ? next.delete(folder) : next.add(folder);
      return next;
    });
  };

  const rows = groups.map((group) => {
    if (!group.folder) {
      const { file, index } = group.entries[0];
      return (
        <FileListRow
          key={group.key}
          file={file}
          onRemove={() => remove(index)}
          onRestore={() => restore(index)}
          onRetry={onRetry ? () => onRetry(index) : undefined}
          removing={"uploadingProgress" in file && !!file.isRemoving}
          actionsDisabled={actionsDisabled}
          allowFailedRemoval={!!onRemove}
        />
      );
    }

    const expanded = expandedFolders.has(group.folder);
    const totalSize = group.entries.reduce(
      (sum, { file }) => sum + Number(file.size),
      0,
    );
    const failedCount = group.entries.filter(
      ({ file }) =>
        "uploadingProgress" in file && file.uploadingProgress < 0,
    ).length;
    const removable = group.entries.every(
      ({ file }) =>
        "uploadingProgress" in file && file.uploadingProgress === 0,
    );

    return (
      <Fragment key={group.key}>
        <tr style={{ background: "rgba(22, 140, 255, 0.045)" }}>
          <td>
            <Group spacing="xs" noWrap>
              <ActionIcon
                variant="subtle"
                color="cyan"
                onClick={() => toggleFolder(group.folder!)}
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
                <Text size="sm" weight={700}>{group.folder}</Text>
                <Text size="xs" color={failedCount ? "red" : "dimmed"}>
                  {group.entries.length} 个文件{failedCount ? ` · ${failedCount} 个失败` : ""}
                </Text>
              </div>
            </Group>
          </td>
          <td>{byteToHumanSizeString(totalSize)}</td>
          <td>
            <Group position="right" spacing={6} noWrap>
              {removable && (
                <Tooltip label="删除整个文件夹">
                  <ActionIcon
                    color="red"
                    variant="light"
                    onClick={() => void removeFolder(group.entries)}
                    disabled={actionsDisabled && !failedCount}
                  >
                    <TbTrash />
                  </ActionIcon>
                </Tooltip>
              )}
            </Group>
          </td>
        </tr>
        {expanded && group.entries.map(({ file, index }) => (
          <FileListRow
            key={"uploadingProgress" in file ? file.uploadId || `${getFileListPath(file)}-${file.size}-${file.lastModified}` : file.id}
            file={file}
            displayName={getFileListPath(file).slice(group.folder!.length + 1)}
            nested
            onRemove={() => remove(index)}
            onRestore={() => restore(index)}
            onRetry={onRetry ? () => onRetry(index) : undefined}
            removing={"uploadingProgress" in file && !!file.isRemoving}
            actionsDisabled={actionsDisabled}
            allowFailedRemoval={!!onRemove}
          />
        ))}
      </Fragment>
    );
  });

  return (
    <Table>
      <thead>
        <tr>
          <th>
            <FormattedMessage id="upload.filelist.name" />
          </th>
          <th>
            <FormattedMessage id="upload.filelist.size" />
          </th>
          <th></th>
        </tr>
      </thead>
      <tbody>{rows}</tbody>
    </Table>
  );
};

export default FileList;

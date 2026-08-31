import { Button, Group } from "@mantine/core";
import { cleanNotifications } from "@mantine/notifications";
import { AxiosError } from "axios";
import { useRouter } from "next/router";
import pLimit from "p-limit";
import { useEffect, useMemo, useRef, useState } from "react";
import { FormattedMessage } from "react-intl";
import Dropzone from "../../components/upload/Dropzone";
import FileList from "../../components/upload/FileList";
import useConfig from "../../hooks/config.hook";
import useTranslate from "../../hooks/useTranslate.hook";
import shareService from "../../services/share.service";
import { FileListItem, FileMetaData, FileUpload } from "../../types/File.type";
import toast from "../../utils/toast.util";
import { filterDuplicateUploads } from "../../utils/filePath.util";

const promiseLimit = pLimit(3);
const MAX_CHUNK_RETRIES = 5;
let errorToastShown = false;

const EditableUpload = ({
  maxShareSize,
  shareId,
  files: savedFiles = [],
}: {
  maxShareSize?: number;
  isReverseShare?: boolean;
  shareId: string;
  files?: FileMetaData[];
}) => {
  const t = useTranslate();
  const router = useRouter();
  const config = useConfig();

  const chunkSize = useRef(parseInt(config.get("share.chunkSize")));

  const [existingFiles, setExistingFiles] =
    useState<Array<FileMetaData & { deleted?: boolean }>>(savedFiles);
  const [uploadingFiles, setUploadingFiles] = useState<FileUpload[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const existingAndUploadedFiles: FileListItem[] = useMemo(
    () => [...uploadingFiles, ...existingFiles],
    [existingFiles, uploadingFiles],
  );
  const dirty = useMemo(() => {
    return (
      existingFiles.some((file) => !!file.deleted) || !!uploadingFiles.length
    );
  }, [existingFiles, uploadingFiles]);

  const setFiles = (files: FileListItem[]) => {
    const _uploadFiles = files.filter(
      (file) => "uploadingProgress" in file,
    ) as FileUpload[];
    const _existingFiles = files.filter(
      (file) => !("uploadingProgress" in file),
    ) as FileMetaData[];

    setUploadingFiles(_uploadFiles);
    setExistingFiles(_existingFiles);
  };

  maxShareSize ??= parseInt(config.get("share.maxSize"));

  const updateUploadingFile = (
    target: FileUpload,
    changes: Partial<FileUpload>,
  ) => {
    Object.assign(target, changes);
    setUploadingFiles((files) =>
      files.map((file) => (file === target ? target : file)),
    );
  };

  const uploadFiles = async (files: FileUpload[]) => {
    const fileUploadPromises = files.map(async (file) =>
      // Limit the number of concurrent uploads to 3
      promiseLimit(async () => {
        const fileId = file.uploadId || crypto.randomUUID();
        updateUploadingFile(file, {
          uploadId: fileId,
          uploadingProgress: 1,
          uploadError: undefined,
        });

        let chunks = Math.ceil(file.size / chunkSize.current);
        let failures = 0;

        // If the file is 0 bytes, we still need to upload 1 chunk
        if (chunks == 0) chunks++;

        for (let chunkIndex = 0; chunkIndex < chunks; chunkIndex++) {
          const from = chunkIndex * chunkSize.current;
          const to = from + chunkSize.current;
          const blob = file.slice(from, to);
          try {
            await shareService
              .uploadFile(
                shareId,
                blob,
                {
                  id: fileId,
                  name: file.uploadPath || file.name,
                },
                chunkIndex,
                chunks,
              )
              .then((response) => {
                if (response.id !== fileId) {
                  throw new Error("Upload ID mismatch");
                }
              });

            failures = 0;
            updateUploadingFile(file, {
              uploadingProgress: ((chunkIndex + 1) / chunks) * 100,
            });
          } catch (e) {
            if (
              e instanceof AxiosError &&
              e.response?.data.error == "unexpected_chunk_index"
            ) {
              // Retry with the expected chunk index
              chunkIndex = e.response!.data!.expectedChunkIndex - 1;
              failures = 0;
              continue;
            }
            failures++;
            if (failures >= MAX_CHUNK_RETRIES) {
              updateUploadingFile(file, {
                uploadingProgress: -1,
                uploadError: "网络或服务器中断，本轮修改已撤销，可重新保存重试",
              });
              return false;
            }
            await new Promise((resolve) => setTimeout(resolve, 2000));
            chunkIndex--;
          }
        }
        return true;
      }),
    );

    return Promise.all(fileUploadPromises);
  };

  const removeFiles = async () => {
    const removedFiles = existingFiles.filter((file) => !!file.deleted);

    if (removedFiles.length > 0) {
      await Promise.all(
        removedFiles.map(async (file) => {
          await shareService.removeFile(shareId, file.id);
        }),
      );

      setExistingFiles(existingFiles.filter((file) => !file.deleted));
    }
  };

  const revertComplete = async () => {
    await shareService.revertComplete(shareId).then();
  };

  const completeShare = async () => {
    return await shareService.completeShare(shareId);
  };

  const save = async () => {
    const retainedExistingCount = existingFiles.filter(
      (file) => !file.deleted,
    ).length;
    if (!retainedExistingCount && !uploadingFiles.length) {
      toast.error("资料包至少要保留一个文件；如需清空，请删除整个资料包");
      return;
    }

    setIsUploading(true);
    let shareWasUnlocked = false;

    try {
      await revertComplete();
      shareWasUnlocked = true;
      const uploadResults = await uploadFiles(uploadingFiles);

      if (uploadResults.some((result) => !result)) {
        const cleanupResults = await Promise.allSettled(
          uploadingFiles
            .filter((file) => file.uploadId)
            .map((file) =>
              shareService.cancelFileUpload(shareId, file.uploadId!),
            ),
        );
        if (cleanupResults.some((result) => result.status === "rejected")) {
          throw new Error("Could not roll back failed uploads");
        }
        await completeShare();
        shareWasUnlocked = false;
        setUploadingFiles((files) =>
          files.map((file) =>
            Object.assign(file, {
              uploadId: undefined,
              uploadingProgress: -1,
              uploadError: "本轮修改已安全撤销，点击保存可重新上传",
            }),
          ),
        );
        toast.error("部分文件上传失败，原资料包已恢复；请检查网络后重新保存");
        return;
      }

      await removeFiles();
      await completeShare();
      shareWasUnlocked = false;
      toast.success(t("share.edit.notify.save-success"));
      router.back();
    } catch {
      if (shareWasUnlocked) {
        await completeShare().catch(() => undefined);
      }
      toast.error(t("share.edit.notify.generic-error"));
    } finally {
      setIsUploading(false);
    }
  };

  const appendFiles = (appendingFiles: FileUpload[]) => {
    const { accepted, duplicateCount } = filterDuplicateUploads(
      existingAndUploadedFiles.filter((file) => !("deleted" in file && file.deleted)),
      appendingFiles,
    );
    if (duplicateCount) toast.error(`已忽略 ${duplicateCount} 个路径重复的文件`);
    if (accepted.length) setUploadingFiles([...accepted, ...uploadingFiles]);
  };

  useEffect(() => {
    // Check if there are any files that failed to upload
    const fileErrorCount = uploadingFiles.filter(
      (file) => file.uploadingProgress == -1,
    ).length;

    if (fileErrorCount > 0) {
      if (!errorToastShown) {
        toast.error(
          t("upload.notify.count-failed", { count: fileErrorCount }),
          {
            withCloseButton: false,
            autoClose: false,
          },
        );
      }
      errorToastShown = true;
    } else {
      cleanNotifications();
      errorToastShown = false;
    }
  }, [uploadingFiles]);

  return (
    <>
      <Group position="right" mb={20}>
        <Button loading={isUploading} disabled={!dirty} onClick={() => save()}>
          <FormattedMessage id="common.button.save" />
        </Button>
      </Group>
      <Dropzone
        title={t("share.edit.append-upload")}
        maxShareSize={maxShareSize}
        onFilesChanged={appendFiles}
        isUploading={isUploading}
      />
      {existingAndUploadedFiles.length > 0 && (
        <FileList files={existingAndUploadedFiles} setFiles={setFiles} />
      )}
    </>
  );
};
export default EditableUpload;

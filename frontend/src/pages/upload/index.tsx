import {
  Alert,
  Button,
  Group,
  Paper,
  Progress,
  SimpleGrid,
  Stack,
  Text,
} from "@mantine/core";
import { useModals } from "@mantine/modals";
import { cleanNotifications } from "@mantine/notifications";
import { AxiosError } from "axios";
import pLimit from "p-limit";
import { useEffect, useRef, useState } from "react";
import { TbAlertTriangle, TbArrowRight, TbRefresh } from "react-icons/tb";
import Meta from "../../components/Meta";
import Dropzone from "../../components/upload/Dropzone";
import FileList from "../../components/upload/FileList";
import showCompletedUploadModal from "../../components/upload/modals/showCompletedUploadModal";
import showCreateUploadModal from "../../components/upload/modals/showCreateUploadModal";
import useConfig from "../../hooks/config.hook";
import useConfirmLeave from "../../hooks/confirm-leave.hook";
import useTranslate from "../../hooks/useTranslate.hook";
import useUser from "../../hooks/user.hook";
import shareService from "../../services/share.service";
import { FileUpload } from "../../types/File.type";
import { CreateShare, Share } from "../../types/share.type";
import toast from "../../utils/toast.util";
import { byteToHumanSizeString } from "../../utils/fileSize.util";
import { filterDuplicateUploads } from "../../utils/filePath.util";

const promiseLimit = pLimit(2);
const MAX_CHUNK_RETRIES = 5;

const Upload = ({
  maxShareSize,
  isReverseShare = false,
  simplified = false,
}: {
  maxShareSize?: number;
  isReverseShare?: boolean;
  simplified?: boolean;
}) => {
  const modals = useModals();
  const t = useTranslate();
  const { user } = useUser();
  const config = useConfig();
  const [files, setFiles] = useState<FileUpload[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSpeed, setUploadSpeed] = useState(0);
  const createdShareRef = useRef<Share>();
  const completingRef = useRef(false);
  const filesRef = useRef<FileUpload[]>([]);
  const speedSampleRef = useRef({ at: Date.now(), bytes: 0 });
  filesRef.current = files;

  useConfirmLeave({ message: t("upload.notify.confirm-leave"), enabled: isUploading });
  const chunkSize = useRef(parseInt(config.get("share.chunkSize")));
  maxShareSize ??= parseInt(config.get("share.maxSize"));
  const autoOpenCreateUploadModal = config.get("share.autoOpenShareModal");

  const updateFile = (target: FileUpload, changes: Partial<FileUpload>) => {
    setFiles((current) => current.map((file) => file === target ? Object.assign(file, changes) : file));
  };

  const recordUploadedBytes = (bytes: number) => {
    const sample = speedSampleRef.current;
    sample.bytes += bytes;
    const now = Date.now();
    const elapsed = (now - sample.at) / 1000;
    if (elapsed < 0.75) return;
    const instantSpeed = sample.bytes / elapsed;
    setUploadSpeed((current) => current > 0 ? current * 0.6 + instantSpeed * 0.4 : instantSpeed);
    speedSampleRef.current = { at: now, bytes: 0 };
  };

  const uploadOne = async (file: FileUpload) => {
    if (!createdShareRef.current) return false;
    const uploadId = file.uploadId || crypto.randomUUID();
    updateFile(file, { uploadId, uploadingProgress: 1, uploadError: undefined });
    let chunks = Math.ceil(file.size / chunkSize.current) || 1;
    let failures = 0;

    for (let chunkIndex = 0; chunkIndex < chunks; chunkIndex++) {
      const blob = file.slice(chunkIndex * chunkSize.current, (chunkIndex + 1) * chunkSize.current);
      try {
        await shareService.uploadFile(
          createdShareRef.current.id,
          blob,
          { id: uploadId, name: file.uploadPath || file.name },
          chunkIndex,
          chunks,
        );
        failures = 0;
        const uploadedBytes = Math.min(file.size, (chunkIndex + 1) * chunkSize.current);
        updateFile(file, {
          uploadingProgress: ((chunkIndex + 1) / chunks) * 100,
          uploadedBytes,
        });
        recordUploadedBytes(blob.size);
      } catch (error) {
        if (error instanceof AxiosError && error.response?.data.error === "unexpected_chunk_index") {
          const expectedChunkIndex = Number(error.response.data.expectedChunkIndex);
          updateFile(file, {
            uploadingProgress: Math.min(99, (expectedChunkIndex / chunks) * 100),
            uploadedBytes: Math.min(file.size, expectedChunkIndex * chunkSize.current),
          });
          chunkIndex = expectedChunkIndex - 1;
          failures = 0;
          continue;
        }
        failures++;
        if (failures >= MAX_CHUNK_RETRIES) {
          const status = error instanceof AxiosError ? error.response?.status : undefined;
          updateFile(file, {
            uploadingProgress: -1,
            uploadError: status === 413
              ? "资料包超过服务器允许的大小"
              : status === 507
                ? "服务器剩余空间不足，请联系主管理员清理空间"
                : "网络或服务器中断，点击右侧按钮可续传",
          });
          return false;
        }
        await new Promise((resolve) => setTimeout(resolve, 2000));
        chunkIndex--;
      }
    }
    return true;
  };

  const uploadIndexes = async (indexes: number[]) => {
    setIsUploading(true);
    const snapshot = filesRef.current;
    const selected = indexes.map((index) => snapshot[index]).filter(Boolean);
    speedSampleRef.current = { at: Date.now(), bytes: 0 };
    setUploadSpeed(0);
    const results = await Promise.all(selected.map((file) => promiseLimit(() => uploadOne(file))));
    if (results.some((result) => !result)) setIsUploading(false);
  };

  const uploadFiles = async (share: CreateShare, selected: FileUpload[]) => {
    setIsUploading(true);
    try {
      createdShareRef.current = await shareService.create(share, isReverseShare);
      const prepared = selected.map((file) => Object.assign(file, { uploadId: crypto.randomUUID(), uploadingProgress: 0, uploadedBytes: 0, uploadError: undefined }));
      setFiles(prepared);
      // Let the state/ref update before the worker reads the selected files.
      filesRef.current = prepared;
      await uploadIndexes(prepared.map((_, index) => index));
    } catch (error) {
      toast.axiosError(error);
      setIsUploading(false);
    }
  };

  const showCreateUploadModalCallback = (selected: FileUpload[]) => showCreateUploadModal(
    modals,
    {
      isUserSignedIn: !!user,
      isPrimaryAdmin: user?.isAdmin === true,
      isReverseShare,
      allowUnauthenticatedShares: false,
      enableEmailRecepients: false,
      maxExpiration: config.get("share.maxExpiration"),
      shareIdLength: config.get("share.shareIdLength"),
      simplified,
    },
    selected,
    uploadFiles,
  );

  const handleFilesChanged = (selected: FileUpload[]) => {
    const { accepted, duplicateCount } = filterDuplicateUploads(
      filesRef.current,
      selected,
    );
    if (duplicateCount) {
      toast.error(`已忽略 ${duplicateCount} 个路径重复的文件`);
    }
    if (!accepted.length) return;
    if (autoOpenCreateUploadModal) {
      setFiles(accepted);
      showCreateUploadModalCallback(accepted);
    } else setFiles((current) => [...current, ...accepted]);
  };

  const removeFile = async (index: number) => {
    const file = filesRef.current[index];
    if (!file || file.isRemoving) return;
    if (isUploading && file.uploadingProgress >= 0) return;

    if (!createdShareRef.current || file.uploadingProgress === 0) {
      setFiles((current) => current.filter((item) => item !== file));
      return;
    }
    if (file.uploadingProgress >= 100 || !file.uploadId) return;

    updateFile(file, { isRemoving: true });
    try {
      await shareService.cancelFileUpload(
        createdShareRef.current.id,
        file.uploadId,
      );

      const remaining = filesRef.current.filter((item) => item !== file);
      if (remaining.length === 0) {
        await shareService.remove(createdShareRef.current.id);
        createdShareRef.current = undefined;
        completingRef.current = false;
        setIsUploading(false);
        cleanNotifications();
      }
      setFiles(remaining);
    } catch (error) {
      setFiles((current) =>
        current.map((item) =>
          item === file ? Object.assign(item, { isRemoving: false }) : item,
        ),
      );
      toast.axiosError(error);
    }
  };

  const failedIndexes = files.map((file, index) => file.uploadingProgress < 0 ? index : -1).filter((index) => index >= 0);
  const completedCount = files.filter((file) => file.uploadingProgress >= 100).length;
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  const uploadedSize = files.reduce(
    (sum, file) => sum + Math.min(file.size, Math.max(0, file.uploadedBytes ?? (file.size * Math.max(0, file.uploadingProgress)) / 100)),
    0,
  );
  const overallProgress = totalSize
    ? (uploadedSize / totalSize) * 100
    : 0;
  const remainingSeconds = uploadSpeed > 0 ? Math.max(0, (totalSize - uploadedSize) / uploadSpeed) : 0;

  useEffect(() => {
    if (!files.length || completingRef.current || !createdShareRef.current) return;
    if (!files.every((file) => file.uploadingProgress >= 100)) return;
    completingRef.current = true;
    shareService.completeShare(createdShareRef.current.id)
      .then((share) => {
        setIsUploading(false);
        showCompletedUploadModal(modals, share);
        setFiles([]);
        createdShareRef.current = undefined;
        cleanNotifications();
      })
      .catch((error) => { setIsUploading(false); toast.axiosError(error); })
      .finally(() => { completingRef.current = false; });
  }, [files, modals]);

  return (
    <>
      <Meta title="上传资料包" />
      <Group position="apart" mb={20}>
        <div>
          <Text weight={800} size="xl">上传资料包</Text>
          <Text color="dimmed" size="sm">多选文件会归入同一个资料包，统一填写名称、注释和期限。</Text>
        </div>
        <Button
          loading={isUploading}
          disabled={!files.length || !!createdShareRef.current}
          rightIcon={<TbArrowRight size={18} />}
          onClick={() => showCreateUploadModalCallback(files)}
        >
          下一步：填写资料包信息
        </Button>
      </Group>

      {!!files.length && !createdShareRef.current && (
        <Paper
          withBorder
          p="md"
          mb="lg"
          sx={{
            borderColor: "var(--qh-brand)",
            background:
              "linear-gradient(110deg,var(--qh-brand-soft),transparent 72%),var(--qh-surface)",
          }}
        >
          <Group position="apart" spacing="md">
            <div style={{ flex: 1, minWidth: 220 }}>
              <Text weight={800}>文件已选好，还需要确认资料包</Text>
              <Text color="dimmed" size="sm" mt={3}>
                点击下一步填写资料包名称、可见范围和有效期；确认后才会真正开始上传。
              </Text>
            </div>
            <Button
              size="md"
              rightIcon={<TbArrowRight size={18} />}
              onClick={() => showCreateUploadModalCallback(files)}
              sx={(theme) => ({
                [theme.fn.smallerThan("sm")]: { width: "100%" },
              })}
            >
              下一步：填写资料包信息
            </Button>
          </Group>
        </Paper>
      )}

      {!!files.length && (
        <Paper withBorder p="md" mb="lg">
          <Group position="apart" align="flex-end">
            <SimpleGrid cols={6} spacing="lg" breakpoints={[{ maxWidth: "sm", cols: 2 }]} sx={{ flex: 1 }}>
              <div><Text size="xs" color="dimmed">文件数量</Text><Text weight={700}>{files.length}</Text></div>
              <div><Text size="xs" color="dimmed">资料总大小</Text><Text weight={700}>{byteToHumanSizeString(totalSize)}</Text></div>
              <div><Text size="xs" color="dimmed">已上传</Text><Text weight={700}>{byteToHumanSizeString(uploadedSize)}</Text></div>
              <div><Text size="xs" color="dimmed">当前速度</Text><Text weight={700}>{uploadSpeed > 0 ? `${byteToHumanSizeString(uploadSpeed)}/s` : "等待测速"}</Text></div>
              <div><Text size="xs" color="dimmed">预计剩余</Text><Text weight={700}>{remainingSeconds > 0 ? formatRemainingTime(remainingSeconds) : "—"}</Text></div>
              <div><Text size="xs" color="dimmed">上传状态</Text><Text weight={700}>{completedCount} 成功 · {failedIndexes.length} 失败</Text></div>
            </SimpleGrid>
            <Text size="sm" weight={700}>{Math.round(overallProgress)}%</Text>
          </Group>
          <Progress mt="sm" value={overallProgress} color={failedIndexes.length ? "orange" : "qihang"} animate={isUploading} />
        </Paper>
      )}

      {failedIndexes.length > 0 && (
        <Alert mb="md" color="orange" icon={<TbAlertTriangle />} title={`${failedIndexes.length} 个文件上传中断`}>
          <Group position="apart">
            <Text size="sm">已上传的分片不会丢失，可以逐个重试或一次重试全部失败文件。</Text>
            <Button compact color="orange" variant="light" leftIcon={<TbRefresh />} onClick={() => uploadIndexes(failedIndexes)} disabled={isUploading}>
              重试全部失败文件
            </Button>
          </Group>
        </Alert>
      )}

      <Dropzone
        title={!autoOpenCreateUploadModal && files.length ? "继续添加到这个资料包" : undefined}
        maxShareSize={maxShareSize}
        onFilesChanged={handleFilesChanged}
        isUploading={isUploading || !!createdShareRef.current}
      />
      {files.length > 0 && (
        <Stack mt="md">
          <FileList<FileUpload>
            files={files}
            setFiles={setFiles}
            onRetry={(index) => uploadIndexes([index])}
            onRemove={removeFile}
            actionsDisabled={isUploading}
          />
        </Stack>
      )}
    </>
  );
};

export default Upload;

function formatRemainingTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "—";
  if (seconds < 60) return `${Math.max(1, Math.ceil(seconds))} 秒`;
  if (seconds < 3600) return `${Math.ceil(seconds / 60)} 分钟`;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.ceil((seconds % 3600) / 60);
  return `${hours} 小时${minutes ? ` ${minutes} 分钟` : ""}`;
}

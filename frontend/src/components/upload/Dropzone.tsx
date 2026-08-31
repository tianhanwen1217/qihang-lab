import { Button, Center, createStyles, Group, Text } from "@mantine/core";
import { Dropzone as MantineDropzone } from "@mantine/dropzone";
import { ForwardedRef, useRef } from "react";
import { TbCloudUpload, TbFileUpload, TbFolderUp } from "react-icons/tb";
import { FormattedMessage } from "react-intl";
import useTranslate from "../../hooks/useTranslate.hook";
import { FileUpload } from "../../types/File.type";
import { byteToHumanSizeString } from "../../utils/fileSize.util";
import toast from "../../utils/toast.util";
import { prepareFileUpload } from "../../utils/filePath.util";

const useStyles = createStyles((theme) => ({
  wrapper: {
    marginBottom: 28,
  },

  dropzone: {
    minHeight: 260,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "var(--qh-border-strong)",
    background: "radial-gradient(circle at 50% 15%,var(--qh-accent-wash),transparent 36%),var(--qh-surface)",
    [theme.fn.smallerThan("sm")]: { minHeight: 230, padding: 20 },
    transition:
      "border-color 180ms ease, background 180ms ease, transform 180ms ease",

    "&:hover": {
      borderColor: "var(--qh-brand)",
      background: "radial-gradient(circle at 50% 15%,var(--qh-accent-wash),transparent 40%),var(--qh-surface-raised)",
      transform: "translateY(-2px)",
    },
  },

  icon: {
    color: "var(--qh-brand)",
  },

  control: {
    marginTop: 16,
    padding: "10px 12px",
    border: "1px solid var(--qh-border)",
    borderRadius: 14,
    background: "var(--qh-surface-raised)",
    [theme.fn.smallerThan("xs")]: {
      width: "100%",
      flexDirection: "column",
      alignItems: "stretch",
      "& button": { width: "100%" },
    },
  },
}));

const Dropzone = ({
  title,
  isUploading,
  maxShareSize,
  onFilesChanged,
}: {
  title?: string;
  isUploading: boolean;
  maxShareSize: number;
  onFilesChanged: (files: FileUpload[]) => void;
}) => {
  const t = useTranslate();

  const { classes } = useStyles();
  const openRef = useRef<() => void>();
  const folderInputRef = useRef<HTMLInputElement>(null);

  const acceptFiles = (files: File[]) => {
    const fileSizeSum = files.reduce((sum, file) => sum + file.size, 0);
    if (fileSizeSum > maxShareSize) {
      toast.error(
        t("upload.dropzone.notify.file-too-big", {
          maxSize: byteToHumanSizeString(maxShareSize),
        }),
      );
      return;
    }
    onFilesChanged(files.map(prepareFileUpload));
  };

  return (
    <div className={classes.wrapper}>
      <MantineDropzone
        onReject={(e) => {
          toast.error(e[0].errors[0].message);
        }}
        disabled={isUploading}
        openRef={openRef as ForwardedRef<() => void>}
        onDrop={acceptFiles}
        className={classes.dropzone}
        radius="md"
      >
        <div style={{ pointerEvents: "none" }}>
          <Group position="center" sx={{ color: "var(--qh-brand)" }}>
            <TbCloudUpload size={58} strokeWidth={1.35} />
          </Group>
          <Text align="center" weight={700} size="lg" mt="xl">
            {title || <FormattedMessage id="upload.dropzone.title" />}
          </Text>
          <Text align="center" size="sm" mt="xs" color="dimmed">
            <FormattedMessage
              id="upload.dropzone.description"
              values={{ maxSize: byteToHumanSizeString(maxShareSize) }}
            />
          </Text>
          <Text align="center" size="xs" mt={6} color="cyan">
            可直接拖入整个文件夹，目录层级会保留到资料包和 ZIP
          </Text>
        </div>
      </MantineDropzone>
      <input
        ref={folderInputRef}
        type="file"
        multiple
        hidden
        disabled={isUploading}
        {...({ webkitdirectory: "", directory: "" } as Record<string, string>)}
        onChange={(event) => {
          acceptFiles(Array.from(event.currentTarget.files || []));
          event.currentTarget.value = "";
        }}
      />
      <Center>
        <Group className={classes.control} spacing="sm" position="center">
          <Button
            variant="light"
            size="sm"
            radius="xl"
            disabled={isUploading}
            leftIcon={<TbFileUpload size={18} />}
            onClick={() => openRef.current && openRef.current()}
          >
            选择文件
          </Button>
          <Button
            variant="outline"
            size="sm"
            radius="xl"
            disabled={isUploading}
            leftIcon={<TbFolderUp size={18} />}
            onClick={() => folderInputRef.current?.click()}
          >
            选择文件夹
          </Button>
        </Group>
      </Center>
    </div>
  );
};
export default Dropzone;

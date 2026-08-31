import {
  Button,
  Divider,
  Group,
  Stack,
  Text,
  ThemeIcon,
} from "@mantine/core";
import { useModals } from "@mantine/modals";
import { ModalsContextProps } from "@mantine/modals/lib/context";
import moment from "moment";
import { useRouter } from "next/router";
import useTranslate from "../../../hooks/useTranslate.hook";
import { CompletedShare } from "../../../types/share.type";
import CopyTextField from "../CopyTextField";
import { FileMetaData } from "../../../types/File.type";
import { TbCheck } from "react-icons/tb";

const showCompletedUploadModal = (
  modals: ModalsContextProps,
  share: CompletedShare,
) => {
  return modals.openModal({
    closeOnClickOutside: false,
    withCloseButton: false,
    closeOnEscape: false,
    title: (
      <Group spacing="sm" noWrap>
        <ThemeIcon color="qihang" variant="light" radius="xl" size="lg">
          <TbCheck size={20} />
        </ThemeIcon>
        <div>
          <Text
            size="xs"
            weight={800}
            sx={{ color: "var(--qh-brand)", letterSpacing: "0.1em" }}
          >
            QIHANG LAB · 上传完成
          </Text>
          <Text weight={800}>资料包已就绪</Text>
        </div>
      </Group>
    ),
    children: <Body share={share} />,
  });
};

const Body = ({ share }: { share: CompletedShare }) => {
  const modals = useModals();
  const router = useRouter();
  const t = useTranslate();

  const isReverseShare = !!router.query["reverseShareToken"];

  const groupLink = `${window.location.origin}/s/${share.id}`;
  const files = ((share.files as FileMetaData[] | undefined) ?? []).filter(
    (file) => !!file.accessToken,
  );

  return (
    <Stack align="stretch">
      <Text size="sm" weight={700}>
        整个资料包分享链接
      </Text>
      <Text size="sm" color="dimmed">
        把这个链接发给对方，即可查看并下载资料包内的全部文件。
      </Text>
      <CopyTextField label="资料包链接" link={groupLink} />
      {!isReverseShare && files.length > 0 && (
        <>
          <Divider label="也可以只分享某个文件" labelPosition="center" />
          <Text size="sm" color="dimmed">
            下面是单个文件的独立链接，仅在只需要发送某个文件时使用。
          </Text>
          {files.map((file) => (
            <CopyTextField
              key={file.id}
              label={file.name}
              link={`${window.location.origin}/f/${file.accessToken}`}
            />
          ))}
        </>
      )}
      {share.notifyReverseShareCreator === true && (
        <Text
          size="sm"
          sx={(theme) => ({
            color:
              theme.colorScheme === "dark"
                ? theme.colors.gray[3]
                : theme.colors.dark[4],
          })}
        >
          {t("upload.modal.completed.notified-reverse-share-creator")}
        </Text>
      )}
      <Text
        size="xs"
        sx={(theme) => ({
          color: theme.colors.gray[6],
        })}
      >
        {/* If our share.expiration is timestamp 0, show a different message */}
        {moment(share.expiration).unix() === 0
          ? t("upload.modal.completed.never-expires")
          : t("upload.modal.completed.expires-on", {
              expiration: moment(share.expiration).format("LLL"),
            })}
      </Text>

      {isReverseShare ? (
        <Button
          onClick={() => {
            modals.closeAll();
            router.reload();
          }}
        >
          完成
        </Button>
      ) : (
        <Group grow>
          <Button
            variant="light"
            onClick={() => {
              modals.closeAll();
              router.push("/upload");
            }}
          >
            继续上传
          </Button>
          <Button
            onClick={() => {
              modals.closeAll();
              router.push("/account/shares");
            }}
          >
            管理我的文件
          </Button>
        </Group>
      )}
    </Stack>
  );
};

export default showCompletedUploadModal;

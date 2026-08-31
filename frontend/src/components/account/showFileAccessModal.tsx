import {
  Button,
  Checkbox,
  Group,
  NumberInput,
  PasswordInput,
  SegmentedControl,
  Select,
  Stack,
  Switch,
  Text,
  TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useClipboard } from "@mantine/hooks";
import { ModalsContextProps } from "@mantine/modals/lib/context";
import { TbCopy } from "react-icons/tb";
import useUser from "../../hooks/user.hook";
import shareService from "../../services/share.service";
import { FileMetaData } from "../../types/File.type";
import toast from "../../utils/toast.util";

const showFileAccessModal = (
  modals: ModalsContextProps,
  shareId: string,
  file: FileMetaData,
  shareExpiration: Date,
  onSaved: () => void,
) =>
  modals.openModal({
    title: "文件发布与分享",
    size: "lg",
    children: (
      <FileAccessForm
        modals={modals}
        shareId={shareId}
        file={file}
        shareExpiration={shareExpiration}
        onSaved={onSaved}
      />
    ),
  });

const FileAccessForm = ({
  modals,
  shareId,
  file,
  shareExpiration,
  onSaved,
}: {
  modals: ModalsContextProps;
  shareId: string;
  file: FileMetaData;
  shareExpiration: Date;
  onSaved: () => void;
}) => {
  const { user } = useUser();
  const clipboard = useClipboard();
  const shareExpiresAt = new Date(shareExpiration);
  const linkExpiresAt = file.linkExpiresAt
    ? new Date(file.linkExpiresAt)
    : shareExpiresAt;
  const permanentLink = !file.linkExpiresAt && shareExpiresAt.getTime() === 0;
  const remainingDays = Math.max(
    1,
    Math.ceil((linkExpiresAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000)),
  );
  const form = useForm({
    initialValues: {
      visibility: file.visibility ?? "UNLISTED",
      linkEnabled: file.linkEnabled ?? true,
      expirationNum: remainingDays,
      expirationUnit: "days",
      permanentLink,
      password: "",
      removePassword: false,
      regenerateToken: false,
    },
  });
  const link = `${window.location.origin}/f/${file.accessToken}`;

  return (
    <form
      onSubmit={form.onSubmit(async (values) => {
        try {
          const expirationChanged =
            form.isDirty("expirationNum") ||
            form.isDirty("expirationUnit") ||
            form.isDirty("permanentLink");
          await shareService.updateFileAccess(shareId, file.id, {
            visibility: values.visibility as "PUBLIC" | "UNLISTED",
            linkEnabled: values.linkEnabled,
            linkExpiration: expirationChanged
              ? values.permanentLink
                ? "never"
                : `${values.expirationNum}-${values.expirationUnit}`
              : undefined,
            password: values.password || undefined,
            removePassword: values.removePassword,
            regenerateToken: values.regenerateToken,
          });
          toast.success("文件分享设置已保存");
          onSaved();
          modals.closeAll();
        } catch (error) {
          toast.axiosError(error);
        }
      })}
    >
      <Stack>
        <Text size="sm" color="dimmed" lineClamp={2}>
          {file.name}
        </Text>
        <SegmentedControl
          fullWidth
          data={[
            { label: "公开（首页可见）", value: "PUBLIC" },
            { label: "仅链接可见", value: "UNLISTED" },
          ]}
          {...form.getInputProps("visibility")}
        />
        <Switch
          label={
            form.values.visibility === "PUBLIC"
              ? "公开文件始终可从首页访问"
              : "启用独立分享链接"
          }
          disabled={form.values.visibility === "PUBLIC"}
          {...form.getInputProps("linkEnabled", { type: "checkbox" })}
        />
        <TextInput
          label="独立文件链接"
          value={file.accessToken ? link : "保存后生成"}
          readOnly
          rightSection={
            file.accessToken &&
            (form.values.visibility === "PUBLIC" || form.values.linkEnabled) ? (
              <TbCopy
                style={{ cursor: "pointer" }}
                onClick={() => {
                  clipboard.copy(link);
                  toast.success("链接已复制");
                }}
              />
            ) : null
          }
        />
        <Checkbox
          label="重新生成独立链接（旧链接会立即失效）"
          {...form.getInputProps("regenerateToken", { type: "checkbox" })}
        />
        <Group grow align="flex-end">
          <NumberInput
            label="链接有效期"
            min={1}
            max={9999}
            disabled={form.values.permanentLink}
            readOnly={form.values.visibility === "PUBLIC"}
            {...form.getInputProps("expirationNum")}
          />
          <Select
            disabled={form.values.permanentLink}
            readOnly={form.values.visibility === "PUBLIC"}
            data={[
              { value: "hours", label: "小时" },
              { value: "days", label: "天" },
              { value: "weeks", label: "周" },
              { value: "months", label: "月" },
            ]}
            {...form.getInputProps("expirationUnit")}
          />
        </Group>
        {user?.isAdmin && (
          <Checkbox
            label="永久链接（仅永久文件可用）"
            {...form.getInputProps("permanentLink", { type: "checkbox" })}
          />
        )}
        <PasswordInput
          label={
            file.passwordProtected
              ? "设置新密码（留空则不修改）"
              : "访问密码（可选）"
          }
          autoComplete="new-password"
          disabled={form.values.visibility === "PUBLIC"}
          {...form.getInputProps("password")}
        />
        {file.passwordProtected && (
          <Checkbox
            label="移除现有密码"
            disabled={form.values.visibility === "PUBLIC"}
            {...form.getInputProps("removePassword", { type: "checkbox" })}
          />
        )}
        <Text size="xs" color="dimmed">
          链接有效期不能晚于文件保留期限；公开文件无需密码即可从首页下载。
        </Text>
        <Group position="right">
          <Button variant="subtle" onClick={() => modals.closeAll()}>
            取消
          </Button>
          <Button type="submit">保存设置</Button>
        </Group>
      </Stack>
    </form>
  );
};

export default showFileAccessModal;

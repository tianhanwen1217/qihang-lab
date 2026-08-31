import {
  Alert,
  Button,
  Checkbox,
  Col,
  Grid,
  NumberInput,
  Select,
  SegmentedControl,
  Stack,
  Text,
  Textarea,
  TextInput,
} from "@mantine/core";
import { useForm, yupResolver } from "@mantine/form";
import { useModals } from "@mantine/modals";
import { ModalsContextProps } from "@mantine/modals/lib/context";
import moment from "moment";
import { useState } from "react";
import { TbAlertCircle } from "react-icons/tb";
import { FormattedMessage } from "react-intl";
import * as yup from "yup";
import useTranslate from "../../../hooks/useTranslate.hook";
import shareService from "../../../services/share.service";
import { FileUpload } from "../../../types/File.type";
import { CreateShare } from "../../../types/share.type";
import { getExpirationPreview } from "../../../utils/date.util";
import toast from "../../../utils/toast.util";
import { Timespan } from "../../../types/timespan.type";

const showCreateUploadModal = (
  modals: ModalsContextProps,
  options: {
    isUserSignedIn: boolean;
    isPrimaryAdmin: boolean;
    isReverseShare: boolean;
    allowUnauthenticatedShares: boolean;
    enableEmailRecepients: boolean;
    maxExpiration: Timespan;
    shareIdLength: number;
    simplified: boolean;
  },
  files: FileUpload[],
  uploadCallback: (createShare: CreateShare, files: FileUpload[]) => void,
) => {
  if (options.simplified) {
    return modals.openModal({
      title: "确认资料包并开始上传",
      children: (
        <SimplifiedCreateUploadModalModal
          options={options}
          files={files}
          uploadCallback={uploadCallback}
        />
      ),
    });
  }

  return modals.openModal({
    title: "确认资料包并开始上传",
    children: (
      <CreateUploadModalBody
        options={options}
        files={files}
        uploadCallback={uploadCallback}
      />
    ),
  });
};

const generateShareId = (length: number = 16) => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  const randomArray = new Uint8Array(length >= 3 ? length : 3);
  crypto.getRandomValues(randomArray);
  randomArray.forEach((number) => {
    result += chars[number % chars.length];
  });
  return result;
};

const generateAvailableLink = async (
  shareIdLength: number,
  times: number = 10,
): Promise<string> => {
  if (times <= 0) {
    throw new Error("Could not generate available link");
  }
  const _link = generateShareId(shareIdLength);
  if (!(await shareService.isShareIdAvailable(_link))) {
    return await generateAvailableLink(shareIdLength, times - 1);
  } else {
    return _link;
  }
};

const CreateUploadModalBody = ({
  uploadCallback,
  files,
  options,
}: {
  files: FileUpload[];
  uploadCallback: (createShare: CreateShare, files: FileUpload[]) => void;
  options: {
    isUserSignedIn: boolean;
    isPrimaryAdmin: boolean;
    isReverseShare: boolean;
    allowUnauthenticatedShares: boolean;
    enableEmailRecepients: boolean;
    maxExpiration: Timespan;
    shareIdLength: number;
  };
}) => {
  const modals = useModals();
  const t = useTranslate();

  const generatedLink = generateShareId(options.shareIdLength);

  const validationSchema = yup.object().shape({
    link: yup
      .string()
      .required(t("common.error.field-required"))
      .min(3, t("common.error.too-short", { length: 3 }))
      .max(50, t("common.error.too-long", { length: 50 }))
      .matches(new RegExp("^[a-zA-Z0-9_-]*$"), {
        message: t("upload.modal.link.error.invalid"),
      }),
    name: yup
      .string()
      .required("请填写资料包名称")
      .min(3, t("common.error.too-short", { length: 3 }))
      .max(30, t("common.error.too-long", { length: 30 })),
  });

  const form = useForm({
    initialValues: {
      name:
        files.length === 1
          ? files[0].name.replace(/\.[^.]+$/, "").slice(0, 30)
          : `资料包 ${moment().format("MM-DD HHmm")}`,
      link: generatedLink,
      description: undefined,
      expiration_num: 30,
      expiration_unit: "-days",
      never_expires: false,
      visibility: "PUBLIC" as "PUBLIC" | "UNLISTED",
    },
    validate: yupResolver(validationSchema),
  });

  const onSubmit = form.onSubmit(async (values) => {
    let internalShareId = values.link;
    if (!(await shareService.isShareIdAvailable(internalShareId))) {
      internalShareId = await generateAvailableLink(
        options.shareIdLength,
      ).catch(() => "");
      if (!internalShareId) {
        toast.error(t("upload.modal.link.error.taken"));
        return;
      }
    }

    const expirationString = form.values.never_expires
      ? "never"
      : form.values.expiration_num + form.values.expiration_unit;

    const expirationDate = moment().add(
      form.values.expiration_num,
      form.values.expiration_unit.replace(
        "-",
        "",
      ) as moment.unitOfTime.DurationConstructor,
    );

    if (
      !options.isPrimaryAdmin &&
      expirationDate.isAfter(moment().add(30, "days").add(1, "minute"))
    ) {
      form.setFieldError("expiration_num", "副管理员最多保留 30 天");
      return;
    }

    if (
      options.maxExpiration.value != 0 &&
      (form.values.never_expires ||
        expirationDate.isAfter(
          moment().add(options.maxExpiration.value, options.maxExpiration.unit),
        ))
    ) {
      form.setFieldError(
        "expiration_num",
        t("upload.modal.expires.error.too-long", {
          max: moment
            .duration(options.maxExpiration.value, options.maxExpiration.unit)
            .humanize(),
        }),
      );
      return;
    }

    uploadCallback(
      {
        id: internalShareId,
        name: values.name,
        expiration: expirationString,
        visibility: values.visibility,
        recipients: [],
        description: values.description,
        security: {
          password: undefined,
          maxViews: undefined,
        },
      },
      files,
    );
    modals.closeAll();
  });

  return (
    <>
      <form onSubmit={onSubmit}>
        <Stack align="stretch">
          {!options.isReverseShare && (
            <>
              <Stack spacing={6}>
                <Text size="sm" weight={600}>
                  文件可见范围
                </Text>
                <SegmentedControl
                  fullWidth
                  data={[
                    { label: "公开（小登可见并下载）", value: "PUBLIC" },
                    { label: "仅链接可见", value: "UNLISTED" },
                  ]}
                  {...form.getInputProps("visibility")}
                />
              </Stack>
              <Grid align={form.errors.expiration_num ? "center" : "flex-end"}>
                <Col xs={6}>
                  <NumberInput
                    min={1}
                    max={99999}
                    precision={0}
                    variant="filled"
                    label={t("upload.modal.expires.label")}
                    disabled={form.values.never_expires}
                    {...form.getInputProps("expiration_num")}
                  />
                </Col>
                <Col xs={6}>
                  <Select
                    disabled={form.values.never_expires}
                    {...form.getInputProps("expiration_unit")}
                    data={[
                      {
                        value: "-minutes",
                        label:
                          form.values.expiration_num == 1
                            ? t("upload.modal.expires.minute-singular")
                            : t("upload.modal.expires.minute-plural"),
                      },
                      {
                        value: "-hours",
                        label:
                          form.values.expiration_num == 1
                            ? t("upload.modal.expires.hour-singular")
                            : t("upload.modal.expires.hour-plural"),
                      },
                      {
                        value: "-days",
                        label:
                          form.values.expiration_num == 1
                            ? t("upload.modal.expires.day-singular")
                            : t("upload.modal.expires.day-plural"),
                      },
                      {
                        value: "-weeks",
                        label:
                          form.values.expiration_num == 1
                            ? t("upload.modal.expires.week-singular")
                            : t("upload.modal.expires.week-plural"),
                      },
                      {
                        value: "-months",
                        label:
                          form.values.expiration_num == 1
                            ? t("upload.modal.expires.month-singular")
                            : t("upload.modal.expires.month-plural"),
                      },
                      {
                        value: "-years",
                        label:
                          form.values.expiration_num == 1
                            ? t("upload.modal.expires.year-singular")
                            : t("upload.modal.expires.year-plural"),
                      },
                    ]}
                  />
                </Col>
              </Grid>
              {options.isPrimaryAdmin && options.maxExpiration.value == 0 && (
                <Checkbox
                  label={t("upload.modal.expires.never-long")}
                  {...form.getInputProps("never_expires")}
                />
              )}
              <Text
                italic
                size="xs"
                sx={(theme) => ({
                  color: theme.colors.gray[6],
                })}
              >
                {getExpirationPreview(
                  {
                    neverExpires: t("upload.modal.completed.never-expires"),
                    expiresOn: t("upload.modal.completed.expires-on"),
                  },
                  form,
                )}
              </Text>
            </>
          )}
          <Stack spacing={8}>
            <Text size="sm" weight={700}>资料包信息</Text>
            <TextInput
              required
              label="资料包名称"
              description="多个文件会作为一个资料包显示和管理"
              variant="filled"
              placeholder="例如：2026 电赛培训资料"
              {...form.getInputProps("name")}
            />
            <Textarea
              label="资料包注释"
              description="这段说明会直接展示在首页，无需打开详情"
              minRows={3}
              variant="filled"
              placeholder="说明资料内容、适用对象或使用方法"
              {...form.getInputProps("description")}
            />
          </Stack>
          <Button type="submit" data-autofocus>
            开始上传这个资料包
          </Button>
        </Stack>
      </form>
    </>
  );
};

const SimplifiedCreateUploadModalModal = ({
  uploadCallback,
  files,
  options,
}: {
  files: FileUpload[];
  uploadCallback: (createShare: CreateShare, files: FileUpload[]) => void;
  options: {
    isUserSignedIn: boolean;
    isPrimaryAdmin: boolean;
    isReverseShare: boolean;
    allowUnauthenticatedShares: boolean;
    enableEmailRecepients: boolean;
    maxExpiration: Timespan;
    shareIdLength: number;
  };
}) => {
  const modals = useModals();
  const t = useTranslate();

  const [showNotSignedInAlert, setShowNotSignedInAlert] = useState(true);

  const validationSchema = yup.object().shape({
    name: yup
      .string()
      .transform((value) => value || undefined)
      .min(3, t("common.error.too-short", { length: 3 }))
      .max(30, t("common.error.too-long", { length: 30 })),
  });

  const form = useForm({
    initialValues: {
      name: undefined,
      description: undefined,
    },
    validate: yupResolver(validationSchema),
  });

  const onSubmit = form.onSubmit(async (values) => {
    const link = await generateAvailableLink(options.shareIdLength).catch(
      () => {
        toast.error(t("upload.modal.link.error.taken"));
        return undefined;
      },
    );

    if (!link) {
      return;
    }

    uploadCallback(
      {
        id: link,
        name: values.name,
        expiration: "30-days",
        visibility: "PUBLIC",
        recipients: [],
        description: values.description,
        security: {
          password: undefined,
          maxViews: undefined,
        },
      },
      files,
    );
    modals.closeAll();
  });

  return (
    <Stack>
      {showNotSignedInAlert && !options.isUserSignedIn && (
        <Alert
          withCloseButton
          onClose={() => setShowNotSignedInAlert(false)}
          icon={<TbAlertCircle size={16} />}
          title={t("upload.modal.not-signed-in")}
          color="yellow"
        >
          <FormattedMessage id="upload.modal.not-signed-in-description" />
        </Alert>
      )}
      <form onSubmit={onSubmit}>
        <Stack align="stretch">
          <Stack align="stretch">
            <TextInput
              variant="filled"
              placeholder={t(
                "upload.modal.accordion.name-and-description.name.placeholder",
              )}
              {...form.getInputProps("name")}
            />
            <Textarea
              variant="filled"
              placeholder={t(
                "upload.modal.accordion.name-and-description.description.placeholder",
              )}
              {...form.getInputProps("description")}
            />
          </Stack>
          <Button type="submit" data-autofocus>
            开始上传这个资料包
          </Button>
        </Stack>
      </form>
    </Stack>
  );
};

export default showCreateUploadModal;

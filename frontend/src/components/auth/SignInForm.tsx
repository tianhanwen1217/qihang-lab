import {
  Button,
  Container,
  createStyles,
  Paper,
  PasswordInput,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useForm, yupResolver } from "@mantine/form";
import { showNotification } from "@mantine/notifications";
import { useRouter } from "next/router";
import Link from "next/link";
import { useState } from "react";
import { TbInfoCircle } from "react-icons/tb";
import * as yup from "yup";
import useUser from "../../hooks/user.hook";
import useTranslate from "../../hooks/useTranslate.hook";
import authService from "../../services/auth.service";
import { safeRedirectPath } from "../../utils/router.util";
import toast from "../../utils/toast.util";

const useStyles = createStyles(() => ({
  shell: {
    position: "relative",
    paddingTop: 58,
    paddingBottom: 84,
  },
  title: {
    color: "var(--qh-text)",
    letterSpacing: "0.04em",
  },
  subtitle: {
    color: "var(--qh-muted)",
  },
  paper: {
    border: "1px solid var(--qh-border)",
    background: "var(--qh-surface-raised)",
    boxShadow: "var(--qh-shadow)",
  },
}));

const SignInForm = ({ redirectPath }: { redirectPath: string }) => {
  const router = useRouter();
  const t = useTranslate();
  const { refreshUser } = useUser();
  const { classes } = useStyles();
  const [submitting, setSubmitting] = useState(false);

  const validationSchema = yup.object().shape({
    emailOrUsername: yup.string().required(t("common.error.field-required")),
    password: yup.string().required(t("common.error.field-required")),
  });

  const form = useForm({
    initialValues: {
      emailOrUsername: "",
      password: "",
    },
    validate: yupResolver(validationSchema),
  });

  const signIn = async (email: string, password: string) => {
    setSubmitting(true);
    await authService
      .signIn(email.trim(), password)
      .then(async (response) => {
        if (response.data["loginToken"]) {
          // Prompt the user to enter their totp code
          showNotification({
            icon: <TbInfoCircle />,
            color: "blue",
            radius: "md",
            title: t("signIn.notify.totp-required.title"),
            message: t("signIn.notify.totp-required.description"),
          });
          router.push(
            `/auth/totp/${
              response.data["loginToken"]
            }?redirect=${encodeURIComponent(redirectPath)}`,
          );
        } else {
          await refreshUser();
          router.replace(safeRedirectPath(redirectPath));
        }
      })
      .catch(toast.axiosError)
      .finally(() => setSubmitting(false));
  };

  return (
    <Container size={420} className={classes.shell}>
      <Title order={2} align="center" weight={900} className={classes.title}>
        老登登录
      </Title>
      <Text size="sm" align="center" mt={8} className={classes.subtitle}>
        主管理员与副管理员从这里进入文件工作台
      </Text>
      <Paper p={30} mt={30} radius="lg" className={classes.paper}>
        <form
          onSubmit={form.onSubmit((values) => {
            signIn(values.emailOrUsername, values.password);
          })}
        >
          <TextInput
            label={t("signin.input.email-or-username")}
            placeholder={t("signin.input.email-or-username.placeholder")}
            {...form.getInputProps("emailOrUsername")}
          />
          <PasswordInput
            label={t("signin.input.password")}
            placeholder={t("signin.input.password.placeholder")}
            mt="md"
            {...form.getInputProps("password")}
          />
          <Button fullWidth mt="xl" type="submit" loading={submitting}>
            进入工作台
          </Button>
          <Button component={Link} href="/" fullWidth mt="sm" variant="subtle">
            返回小登首页
          </Button>
        </form>
      </Paper>
    </Container>
  );
};

export default SignInForm;

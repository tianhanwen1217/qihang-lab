import { NotificationProps, showNotification } from "@mantine/notifications";
import { TbCheck, TbX } from "react-icons/tb";
import { FormattedMessage } from "react-intl";

const ToastTitle = ({ status }: { status: "success" | "error" }) => (
  <span>
    <span
      style={{
        color: "var(--qh-brand)",
        fontSize: 10,
        fontWeight: 800,
        letterSpacing: "0.12em",
        marginRight: 8,
      }}
    >
      QIHANG LAB
    </span>
    <FormattedMessage
      id={status === "success" ? "common.success" : "common.error"}
    />
  </span>
);

const error = (message: string, config?: Omit<NotificationProps, "message">) =>
  showNotification({
    icon: <TbX />,
    color: "red",
    radius: "md",
    title: <ToastTitle status="error" />,
    message: message,
    autoClose: 6500,

    ...config,
  });

const axiosError = (axiosError: any) =>
  error(
    axiosError?.response?.data?.message ??
      "操作未完成，请检查网络后重试。",
  );

const success = (
  message: string,
  config?: Omit<NotificationProps, "message">,
) =>
  showNotification({
    icon: <TbCheck />,
    color: "green",
    radius: "md",
    title: <ToastTitle status="success" />,
    message: message,
    autoClose: 4200,
    ...config,
  });

const toast = {
  error,
  success,
  axiosError,
};
export default toast;

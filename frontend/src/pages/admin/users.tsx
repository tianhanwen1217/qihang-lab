import { Button, Group, Space, Text, Title } from "@mantine/core";
import { useModals } from "@mantine/modals";
import { useEffect, useState } from "react";
import { TbPlus } from "react-icons/tb";
import { FormattedMessage } from "react-intl";
import Meta from "../../components/Meta";
import ManageUserTable from "../../components/admin/users/ManageUserTable";
import showCreateUserModal from "../../components/admin/users/showCreateUserModal";
import useConfig from "../../hooks/config.hook";
import useTranslate from "../../hooks/useTranslate.hook";
import userService from "../../services/user.service";
import User from "../../types/user.type";
import toast from "../../utils/toast.util";

const Users = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const config = useConfig();
  const modals = useModals();
  const t = useTranslate();

  const getUsers = () => {
    setIsLoading(true);
    userService
      .list()
      .then(setUsers)
      .catch(toast.axiosError)
      .finally(() => setIsLoading(false));
  };

  const deleteUser = (user: User) => {
    modals.openConfirmModal({
      title: `停用副管理员 ${user.username}`,
      children: (
        <Text size="sm">
          该账号将无法继续登录，其上传文件会转交给主管理员，现有分享链接不会失效。
        </Text>
      ),
      labels: {
        confirm: "确认停用",
        cancel: t("common.button.cancel"),
      },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        userService
          .remove(user.id)
          .then(() => setUsers(users.filter((v) => v.id != user.id)))
          .catch(toast.axiosError);
      },
    });
  };

  useEffect(() => {
    getUsers();
  }, []);

  return (
    <>
      <Meta title={t("admin.users.title")} />
      <Group position="apart" align="baseline" mb={20}>
        <Title mb={30} order={3}>
          <FormattedMessage id="admin.users.title" />
        </Title>
        <Button
          onClick={() =>
            showCreateUserModal(modals, config.get("smtp.enabled"), getUsers)
          }
          leftIcon={<TbPlus size={20} />}
        >
          <FormattedMessage id="common.button.create" />
        </Button>
      </Group>

      <ManageUserTable
        users={users}
        getUsers={getUsers}
        deleteUser={deleteUser}
        isLoading={isLoading}
      />
      <Space h="xl" />
    </>
  );
};

export default Users;

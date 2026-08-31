import { ActionIcon, Badge, Box, Group, Skeleton, Table } from "@mantine/core";
import { useModals } from "@mantine/modals";
import { TbEdit, TbUserOff } from "react-icons/tb";
import User from "../../../types/user.type";
import showUpdateUserModal from "./showUpdateUserModal";
import { FormattedMessage } from "react-intl";

const ManageUserTable = ({
  users,
  getUsers,
  deleteUser,
  isLoading,
}: {
  users: User[];
  getUsers: () => void;
  deleteUser: (user: User) => void;
  isLoading: boolean;
}) => {
  const modals = useModals();

  return (
    <Box sx={{ display: "block", overflowX: "auto" }}>
      <Table verticalSpacing="sm">
        <thead>
          <tr>
            <th>
              <FormattedMessage id="admin.users.table.username" />
            </th>
            <th>
              <FormattedMessage id="admin.users.table.email" />
            </th>
            <th>角色</th>
            <th>状态</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {isLoading
            ? skeletonRows
            : users.map((user) => (
                <tr key={user.id}>
                  <td>
                    {user.username}{" "}
                    {user.isLdap ? (
                      <Badge style={{ marginLeft: "1em" }}>LDAP</Badge>
                    ) : null}
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <Badge color={user.isAdmin ? "orange" : "blue"}>
                      {user.isAdmin ? "主管理员" : "副管理员"}
                    </Badge>
                  </td>
                  <td>
                    <Badge color={user.isActive ? "green" : "gray"}>
                      {user.isActive ? "正常" : "已停用"}
                    </Badge>
                  </td>
                  <td>
                    <Group position="right">
                      {user.isLdap ? null : (
                        <ActionIcon
                          variant="light"
                          color="primary"
                          size="sm"
                          onClick={() =>
                            showUpdateUserModal(modals, user, getUsers)
                          }
                        >
                          <TbEdit />
                        </ActionIcon>
                      )}
                      {!user.isAdmin && user.isActive && (
                        <ActionIcon
                          variant="light"
                          color="red"
                          size="sm"
                          title="停用账号并移交文件"
                          onClick={() => deleteUser(user)}
                        >
                          <TbUserOff />
                        </ActionIcon>
                      )}
                    </Group>
                  </td>
                </tr>
              ))}
        </tbody>
      </Table>
    </Box>
  );
};

const skeletonRows = [...Array(10)].map((v, i) => (
  <tr key={i}>
    <td>
      <Skeleton key={i} height={20} />
    </td>
    <td>
      <Skeleton key={i} height={20} />
    </td>
    <td>
      <Skeleton key={i} height={20} />
    </td>
    <td>
      <Skeleton key={i} height={20} />
    </td>
    <td>
      <Skeleton key={i} height={20} />
    </td>
  </tr>
));

export default ManageUserTable;

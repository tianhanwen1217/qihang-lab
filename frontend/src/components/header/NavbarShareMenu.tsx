import { ActionIcon } from "@mantine/core";
import Link from "next/link";
import { TbFiles } from "react-icons/tb";

const NavbarFileLink = () => (
  <ActionIcon
    component={Link}
    href="/account/shares"
    title="我的文件"
    color="cyan"
    variant="subtle"
  >
    <TbFiles />
  </ActionIcon>
);

export default NavbarFileLink;

import { Button, Center, Group, Stack, Text, Title } from "@mantine/core";
import { useModals } from "@mantine/modals";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { TbUpload } from "react-icons/tb";
import PackageHistoryList from "../../components/account/PackageHistoryList";
import CenterLoader from "../../components/core/CenterLoader";
import Meta from "../../components/Meta";
import shareService from "../../services/share.service";
import { FileMetaData } from "../../types/File.type";
import { MyShare } from "../../types/share.type";
import toast from "../../utils/toast.util";

const MyFiles = () => {
  const modals = useModals();
  const [shares, setShares] = useState<MyShare[]>();
  const load = useCallback(() => { shareService.getMyShares().then(setShares).catch(toast.axiosError); }, []);
  useEffect(load, [load]);
  if (!shares) return <CenterLoader />;

  const confirmPackageDelete = (share: MyShare) => modals.openConfirmModal({
    title: "删除资料包",
    children: <Text size="sm">确认删除“{share.name || "未命名资料包"}”及其中全部文件和链接吗？此操作无法恢复。</Text>,
    labels: { confirm: "确认删除", cancel: "取消" },
    confirmProps: { color: "red" },
    onConfirm: async () => { try { await shareService.remove(share.id); load(); } catch (error) { toast.axiosError(error); } },
  });

  const confirmFileDelete = (share: MyShare, file: FileMetaData) => modals.openConfirmModal({
    title: "删除文件",
    children: <Text size="sm">删除后文件和独立链接都无法恢复，确认删除“{file.name}”吗？</Text>,
    labels: { confirm: "确认删除", cancel: "取消" },
    confirmProps: { color: "red" },
    onConfirm: async () => { try { share.files.length === 1 ? await shareService.remove(share.id) : await shareService.removeFile(share.id, file.id); load(); } catch (error) { toast.axiosError(error); } },
  });

  return (
    <>
      <Meta title="资料包与链接历史" />
      <Group position="apart" mb={28} align="flex-end">
        <div><Title order={2}>资料包与链接历史</Title><Text color="dimmed" mt={5}>每次上传作为一个资料包管理；过期后删除实际文件，但继续保留名称、说明和链接记录。</Text></div>
        <Button component={Link} href="/upload" leftIcon={<TbUpload />}>上传资料包</Button>
      </Group>
      {!shares.length ? (
        <Center mih={420}><Stack align="center"><Text weight={700}>还没有上传记录</Text><Button component={Link} href="/upload" variant="light">上传第一个资料包</Button></Stack></Center>
      ) : (
        <PackageHistoryList shares={shares} reload={load} onDeletePackage={confirmPackageDelete} onDeleteFile={confirmFileDelete} />
      )}
    </>
  );
};

export default MyFiles;

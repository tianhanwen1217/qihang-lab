import { Skeleton, Stack } from "@mantine/core";
import { MyShare } from "../../../types/share.type";
import PackageHistoryList from "../../account/PackageHistoryList";

const ManageShareTable = ({
  shares,
  deleteShare,
  isLoading,
  getShares,
}: {
  shares: MyShare[];
  deleteShare: (share: MyShare) => void;
  isLoading: boolean;
  getShares: () => void;
}) => {
  if (isLoading) {
    return <Stack>{[0, 1, 2].map((key) => <Skeleton key={key} height={150} radius="md" />)}</Stack>;
  }
  return (
    <PackageHistoryList
      shares={shares}
      reload={getShares}
      onDeletePackage={deleteShare}
    />
  );
};

export default ManageShareTable;

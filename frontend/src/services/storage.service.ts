import { StorageStats } from "../types/storage.type";
import api from "./api.service";

const getStats = async (): Promise<StorageStats> =>
  (await api.get("admin/storage")).data;

export default { getStats };

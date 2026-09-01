import {
  PublicFile,
  PublicFilePage,
  PublicPackagePage,
} from "../types/publicFile.type";
import api from "./api.service";

const list = async (search = "", page = 1): Promise<PublicFilePage> =>
  (
    await api.get("/public/files", {
      params: { search, page, pageSize: 24 },
    })
  ).data;

const get = async (token: string): Promise<PublicFile> =>
  (await api.get(`/public/files/${token}`)).data;

const unlock = async (token: string, password?: string) =>
  (await api.post(`/public/files/${token}/unlock`, { password })).data;

const star = async (token: string): Promise<{ stars: number }> =>
  (await api.post(`/public/files/${token}/star`)).data;

const getTextContent = async (token: string): Promise<string> =>
  (
    await api.get(`/public/files/${token}/content`, {
      params: { download: false },
      responseType: "text",
    })
  ).data;

const contentUrl = (token: string, download = true) =>
  `/api/public/files/${token}/content?download=${download}`;

const packageContentUrl = (id: string) =>
  `/api/public/files/packages/${id}/content`;

const listPackages = async (
  search = "",
  page = 1,
  category = "ALL",
  sort = "LATEST",
): Promise<PublicPackagePage> =>
  (
    await api.get("/public/files/packages", {
      params: { search, page, pageSize: 12, category, sort },
    })
  ).data;

const listPackageFiles = async (
  id: string,
  page = 1,
): Promise<PublicFilePage> =>
  (
    await api.get(`/public/files/packages/${id}/files`, {
      params: { page, pageSize: 60 },
    })
  ).data;

export default {
  list,
  listPackages,
  listPackageFiles,
  get,
  unlock,
  star,
  getTextContent,
  contentUrl,
  packageContentUrl,
};

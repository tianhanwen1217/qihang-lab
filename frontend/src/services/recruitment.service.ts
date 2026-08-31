import api from "./api.service";
import { RecruitmentChannel } from "../types/recruitment.type";

const list = async (): Promise<RecruitmentChannel[]> => (await api.get("/recruitment")).data;
const listAdmin = async (): Promise<RecruitmentChannel[]> => (await api.get("/recruitment/admin")).data;

const create = async (file: File, name: string, description: string, enabled: boolean) => {
  const form = new FormData();
  form.append("file", file); form.append("name", name); form.append("description", description); form.append("enabled", String(enabled));
  return (await api.post("/recruitment/admin", form)).data;
};

const update = async (channel: RecruitmentChannel) => (await api.patch(`/recruitment/admin/${channel.id}`, {
  name: channel.name, description: channel.description, enabled: String(Boolean(channel.enabled)), order: String(channel.order),
})).data;

const replaceImage = async (id: string, file: File) => {
  const form = new FormData(); form.append("file", file);
  return (await api.post(`/recruitment/admin/${id}/image`, form)).data;
};

const remove = async (id: string) => api.delete(`/recruitment/admin/${id}`);

export default { list, listAdmin, create, update, replaceImage, remove };

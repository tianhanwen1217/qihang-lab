export type FileUpload = File & {
  uploadingProgress: number;
  uploadError?: string;
  uploadId?: string;
  isRemoving?: boolean;
  uploadPath?: string;
  uploadedBytes?: number;
};

export type FileUploadResponse = { id: string; name: string };

export type FileMetaData = {
  id: string;
  name: string;
  size: string;
  visibility?: "PUBLIC" | "UNLISTED";
  accessToken?: string;
  linkExpiresAt?: string | null;
  linkEnabled?: boolean;
  passwordProtected?: boolean;
  views?: number;
};

export type FileListItem = FileUpload | (FileMetaData & { deleted?: boolean });

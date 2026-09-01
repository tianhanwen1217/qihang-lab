export type PublicFile = {
  token: string;
  name: string;
  size: string;
  createdAt: string;
  expiresAt: string;
  linkExpiresAt?: string;
  visibility: "PUBLIC" | "UNLISTED";
  passwordProtected: boolean;
  uploader: string;
  description?: string;
  category: string;
  views: number;
  downloads: number;
  stars: number;
};

export type PublicFilePage = {
  items: PublicFile[];
  total: number;
  page: number;
  pageSize: number;
};

export type PublicPackage = {
  id: string;
  downloadId?: string;
  name: string;
  description?: string;
  createdAt: string;
  expiresAt: string;
  uploader: string;
  fileCount: number;
  totalSize: number;
  downloads: number;
  views: number;
  stars: number;
  downloadableAsZip: boolean;
  files: PublicFile[];
};

export type PublicPackagePage = {
  items: PublicPackage[];
  total: number;
  page: number;
  pageSize: number;
};

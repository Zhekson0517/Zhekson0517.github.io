export interface FileEntry {
  name: string;
  path: string;
  is_dir: boolean;
  children: FileEntry[];
}

export interface ProjectInfo {
  dir: string;
  name: string;
}

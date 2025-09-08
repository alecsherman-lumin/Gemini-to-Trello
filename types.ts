export interface ActionItem {
  id: string;
  title: string;
  description: string;
}

export interface AutoPostResult {
  posted: ActionItem[];
  failed: { title: string; error: string }[];
}

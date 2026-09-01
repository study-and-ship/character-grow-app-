export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
}

export interface WithId {
  id: number;
}

export type Nullable<T> = T | null;

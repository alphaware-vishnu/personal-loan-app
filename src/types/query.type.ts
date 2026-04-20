import type { AxiosError } from "axios";

export interface QueryApiResponse<TData> {
  data: TData;
  message: string;
  httpStatus: string;
}

export interface MutationApiResponse<TData> {
  message: string;
  httpStatus: string;
  data: TData;
}

export interface QueryListApiResponse<TData> {
  data: {
    records: TData[];
    totalRecords: number;
    currentCount: number;
    hasNextPage: boolean;
  };
}


export type QueryError = AxiosError<{
  message: string;
  description?: string;
  status: "FAILURE";
}>;
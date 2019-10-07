import NetError from './error';

export type Methods =
  | 'DELETE'
  | 'GET'
  | 'HEAD'
  | 'OPTIONS'
  | 'PATCH'
  | 'POST'
  | 'PUT';

export type QueryParams = string | [string, any][] | Record<string, any>;

export type RequestHeaders = [string, any][] | Record<string, any>;

export type Events = {
  complete?<T>(response: Response<T>): void;
  error?(error: Error): void;
  downloadProgress?(event: ProgressEvent): void;
  uploadProgress?(event: ProgressEvent): void;
};

export type Transformers<R, T> = {
  request?(body: R): any;
  response?(data: any): T;
  error?(error: NetError<T>): Error;
};

export type Promises<T> = {
  complete: Promise<Response<T>>;
};

export type RequestOptions<R, T> = {
  query?: QueryParams;
  headers?: RequestHeaders;
  responseType?: XMLHttpRequestResponseType;
  body?: R;
  on?: Events;
  transformers?: Transformers<R, T>;
};

export interface Request<T> {
  request: XMLHttpRequest;
  on: Promises<T>;
  cancel: () => void;
}

export type ParsedHeader = {
  name: string;
  value: string;
};

export interface Response<T> {
  data: T;
  request: XMLHttpRequest;
}

import NetError from './error';
import {CancellablePromise, Rejector, Resolver} from './promise';

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

export type Transformers<R, T, E = any> = {
  request?(body: R): any;
  response?(data: any): T;
  errorResponse?(data: any): E;
  error?(error: NetError<E>): Error;
};

export type Promises<T> = {
  complete: Promise<Response<T>>;
};

export type RequestOptions<R, T, E = any> = {
  query?: QueryParams;
  headers?: RequestHeaders;
  responseType?: XMLHttpRequestResponseType;
  body?: R;
  on?: Events;
  transformers?: Transformers<R, T, E>;
};

export interface Request<T> {
  request: XMLHttpRequest;
  // Deprecated (2019-11-05)
  on: Promises<T>;
  response: Promise<Response<T>>;
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

export interface OfflineRequestItem {
  method: Methods;
  url: string;
  options: RequestOptions<any, any, any>;
  cancellable: CancellablePromise<Response<any>>;
  resolve: Resolver<any>;
  reject: Rejector;
}

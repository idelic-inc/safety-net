import NetError from './error';
import {CancellablePromise} from './promise';

export type Method =
  | 'DELETE'
  | 'GET'
  | 'HEAD'
  | 'OPTIONS'
  | 'PATCH'
  | 'POST'
  | 'PUT';
export type QueryParams = string | [string, any][] | Record<string, any>;
export type RequestHeaders = [string, any][] | Record<string, any>;
export type ResponseType =
  | 'arraybuffer'
  | 'blob'
  | 'document'
  | 'json'
  | 'text'
  | 'stream';
export type Events = {
  complete?<T>(response: Response<T>): void;
  error?(error: Error): void;
  downloadProgress?(event: ProgressEvent): void;
  uploadProgress?(event: ProgressEvent): void;
};
export type Transformers = {
  errors?<T>(error: NetError<T>): Error;
};
export type Promises<T> = {
  complete: Promise<Response<T>>;
};

export type RequestOptions = {
  query?: QueryParams;
  headers?: RequestHeaders;
  responseType?: XMLHttpRequestResponseType;
  body?: any;
  on?: Events;
  transformers?: Transformers;
};

export interface Request<T> {
  request: XMLHttpRequest;
  on: Promises<T>;
  cancel: () => void;
}

export interface Response<T> {
  data: T;
  request: XMLHttpRequest;
}

export {NetError};

export default {
  request,
  ['delete']: createRequest('DELETE'),
  ['get']: createRequest('GET'),
  head: createRequest('HEAD'),
  options: createRequest('OPTIONS'),
  patch: createRequest('PATCH'),
  post: createRequest('POST'),
  put: createRequest('PUT')
};

function createRequest(method: Method) {
  return function runRequest<T>(
    url: string,
    options?: RequestOptions
  ): Request<T> {
    return request(method, url, options);
  };
}

function request<T>(
  method: string,
  url: string,
  options: RequestOptions = {}
): Request<T> {
  const request = new XMLHttpRequest();
  request.open(method, parseUrl(url, options.query));

  const headers = parseHeaders(options.headers);
  headers.forEach(header =>
    request.setRequestHeader(header.name, header.value)
  );

  request.withCredentials = true;
  request.responseType = options.responseType || 'json';

  const cancellable = addEventListeners<T>(request, options);

  request.send(parseBody(options.body, headers));

  return {
    request,
    on: {
      complete: cancellable._promise
    },
    cancel: cancellable.cancel
  };
}

function parseUrl(url: string, query?: QueryParams): string {
  if (query) {
    const queryString = parseQuery(query);
    return url.includes('?')
      ? url.endsWith('&')
        ? `${url}${queryString}`
        : `${url}&${queryString}`
      : `${url}?${queryString}`;
  } else {
    return url;
  }
}

function parseQuery(query: QueryParams): string {
  if (typeof query == 'string') {
    return query;
  } else if (Array.isArray(query)) {
    return query.map(pair => parseQueryOption(pair[0], pair[1])).join('&');
  } else {
    return Object.keys(query)
      .filter(queryKey => typeof query[queryKey] != 'undefined')
      .map(queryKey => parseQueryOption(queryKey, query[queryKey]))
      .join('&');
  }
}

function parseQueryOption(key: string, value: any): string {
  if (Array.isArray(value)) {
    return value.map(item => `${key}=${item}`).join('&');
  } else if (typeof value == 'undefined' || value === null) {
    return key;
  } else {
    return `${key}=${value}`;
  }
}

type ParsedHeader = {
  name: string;
  value: string;
};

function parseHeaders(headers?: RequestHeaders): ParsedHeader[] {
  if (!headers) {
    return [];
  } else if (Array.isArray(headers)) {
    return headers.map(([name, value]) => ({
      name: normalizeHeaderName(name),
      value: `${value}`
    }));
  } else {
    return Object.keys(headers).map(name => ({
      name: normalizeHeaderName(name),
      value: `${headers[name]}`
    }));
  }
}

function normalizeHeaderName(name: string): string {
  return name
    .split('-')
    .map(namePart => {
      const lowerName = namePart.toLowerCase();
      return lowerName[0].toUpperCase() + lowerName.slice(1);
    })
    .join('-');
}

function addEventListeners<T>(
  request: XMLHttpRequest,
  options: RequestOptions
): CancellablePromise<Response<T>> {
  const on: Events = options.on || {};

  const cancellable = new CancellablePromise<Response<T>>(
    (resolve, reject) => {
      request.addEventListener('loadend', () => {
        if (request.status >= 200 && request.status < 400) {
          resolve(createResponse<T>(request));
        } else {
          reject(createError<T>(request, options.transformers));
        }
      });
    },
    reject => {
      request.abort();
      reject(createError<T>(request, options.transformers));
    }
  );

  cancellable._promise.then(on.complete, on.error);
  on.downloadProgress &&
    request.addEventListener('progress', on.downloadProgress);
  on.uploadProgress &&
    request.upload.addEventListener('progress', on.uploadProgress);

  return cancellable;
}

function parseBody(body: any, headers: ParsedHeader[]): any | null {
  if (body) {
    const contentType = headers
      .filter(header => header.name == 'Content-Type')
      .map(header => header.value)[0];
    if (contentType == 'application/json' && typeof body != 'string') {
      return JSON.stringify(body);
    } else {
      return body;
    }
  } else {
    return null;
  }
}

function createResponse<T>(request: XMLHttpRequest): any {
  return {
    data: parseResponseBody(request) as T,
    request
  };
}

function createError<T>(
  request: XMLHttpRequest,
  transformers?: Transformers
): Error {
  const netError = new NetError<T>(request, parseResponseBody(request));
  if (transformers && transformers.errors) {
    return transformers.errors(netError);
  }
  return netError;
}

function parseResponseBody(request: XMLHttpRequest): any {
  if (isJsonResponse(request)) {
    try {
      return JSON.parse(request.response);
    } catch (e) {
      return null;
    }
  } else {
    return request.response;
  }
}

function isJsonResponse(request: XMLHttpRequest): boolean {
  // IE 11 does not honour the `responseType` attribute on the request.
  if (request.getResponseHeader) {
    const contentType = request.getResponseHeader('Content-Type') || '';
    return (
      typeof request.response == 'string' &&
      contentType.includes('application/json')
    );
  }
  return false;
}

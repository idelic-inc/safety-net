import NetError from './error';
import {CancellablePromise} from './promise';
import {handleLoadEnd} from './retry';
import {Events, RequestOptions, Response, Transformers} from './types';

export function addEventListeners<T, E>(
  request: XMLHttpRequest,
  options: RequestOptions<any, T, E>,
  method: string,
  url: string
): CancellablePromise<Response<T>> {
  const on: Events = options.on || {};

  const cancellable = new CancellablePromise<Response<T>>(
    (resolve, reject) => {
      request.addEventListener('loadend', () => {
        handleLoadEnd(request, method, url, options, cancellable, resolve, reject);
      });
    },
    reject => {
      request.abort();
      reject(createError<E>(request, options.transformers));
    }
  );

  cancellable._promise.then(on.complete, on.error || defaultErrorHandler);
  on.downloadProgress &&
    request.addEventListener('progress', on.downloadProgress);
  on.uploadProgress &&
    request.upload.addEventListener('progress', on.uploadProgress);

  return cancellable;
}

export function createResponse<T>(
  request: XMLHttpRequest,
  transformer?: (body: any) => T
): Response<T> {
  const body = parseResponseBody(request);
  const data = transformer ? transformer(body) : (body as T);
  return {data, request};
}

export function createError<E>(
  request: XMLHttpRequest,
  transformers?: Transformers<any, any>
): Error {
  const netError = new NetError<E>(
    request,
    createResponse(request, transformers?.errorResponse).data
  );
  if (transformers && transformers.error) {
    return transformers.error(netError);
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

function defaultErrorHandler(): void {
  // Do nothing. This prevents unnecessary unhandledrejection events since the
  // caller can handle them either here or via the promise API.
}

import NetError from './error';
import {CancellablePromise} from './promise';
import {Events, RequestOptions, Response, Transformers} from './types';

export function addEventListeners<T>(
  request: XMLHttpRequest,
  options: RequestOptions<any, T>
): CancellablePromise<Response<T>> {
  const on: Events = options.on || {};

  const cancellable = new CancellablePromise<Response<T>>(
    (resolve, reject) => {
      request.addEventListener('loadend', () => {
        if (request.status >= 200 && request.status < 400) {
          resolve(createResponse<T>(request, options.transformers));
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


function createResponse<T>(request: XMLHttpRequest, transformers?: Transformers<any, T>): Response<T> {
  const body = parseResponseBody(request);
  const data = (transformers && transformers.response)
    ? transformers.response(body)
    : (body as T);
  return {data, request};
}

function createError<T>(
  request: XMLHttpRequest,
  transformers?: Transformers<any, any>
): Error {
  const netError = new NetError<T>(request, createResponse(request, transformers).data);
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


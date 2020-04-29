import {CancellablePromise, Rejector, Resolver} from './promise';
import {parseHeaders, parseRequestBody, parseUrl} from './request';
import {createError, createResponse} from './response';
import {Methods, OfflineRequestItem, Request, RequestOptions, Response} from './types';

const offlineRequestQueue: OfflineRequestItem[] = [];

const detectOnlineStatus = (): boolean => {	
  try {	
    return Boolean(window && window.addEventListener);	
  } catch (e) {	
    return false;	
  }	
};	

if (detectOnlineStatus()) {	
  window.addEventListener('online', () => {	
    while (offlineRequestQueue.length > 0) {	
      const item = offlineRequestQueue.shift();	
      if (item) {	
        requestAgain(item.method, item.url, item.options, item.cancellable, item.resolve, item.reject);	
      }	
    }	
  });	
}

function requestAgain<T>(	
  method: string,	
  url: string,	
  options: RequestOptions<any, T>,	
  cancellable: CancellablePromise<Response<T>>,	
  resolve: Resolver<T>,	
  reject: Rejector): Request<T> {	
  const request = new XMLHttpRequest();	
  request.open(method, parseUrl(url, options.query));	

  const headers = parseHeaders(options.headers);	
  headers.forEach(header => request.setRequestHeader(header.name, header.value));	

  request.withCredentials = true;	
  request.responseType = options.responseType || 'json';	
  request.send(parseRequestBody(options.body, headers));	

  request.addEventListener('loadend', () => {	
    addRequestEventListener(request, method, url, options, cancellable, resolve, reject);	
  });

  return {	
    request,	
    on: {	
      complete: cancellable._promise	
    },
    response: cancellable._promise,
    cancel: cancellable.cancel	
 };	
}

export function addRequestEventListener(	
  request: XMLHttpRequest, 	
  method: string,	
  url: string,	
  options: RequestOptions<any, any>,	
  cancellable: CancellablePromise<Response<any>>,	
  resolve: Resolver<any>,	
  reject: Rejector): void {	
  if (detectOnlineStatus() && !navigator.onLine) {	
    offlineRequestQueue.push({method: method as Methods, url, options, cancellable, resolve, reject});	
  } else if (request.status >= 200 && request.status < 400) {	
    resolve(createResponse<any>(request));	
  } else {	
    reject(createError<any>(request, options.transformers));	
  }	
}
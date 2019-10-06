import NetError from './error';
import {createRequest, request} from './request';

export * from './types';

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


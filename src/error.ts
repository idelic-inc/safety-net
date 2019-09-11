export default class NetError<T> extends Error {
  request: XMLHttpRequest;
  response: T;

  constructor(request: XMLHttpRequest, response: T) {
    super(NetError.createErrorMessage(request));
    this.request = request;
    this.response = response;
    Object.setPrototypeOf(this, NetError.prototype);
  }

  static createErrorMessage(request: XMLHttpRequest): string {
    switch (Math.floor(request.status / 100)) {
      case 4:
        return 'Error performing request. Please double check your input and try again.';
      case 5:
        return 'Unexpected server error. Please try again.';
      case 0:
        if (request.readyState == 0) {
          return 'Request was cancelled.';
        } else {
          return 'There is a connection issue.  Please check your internet connection and try again.';
        }
      default:
        return 'Unexpected network error';
    }
  }
}

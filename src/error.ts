export default class NetError<E> extends Error {
  request: XMLHttpRequest;
  response: E | null;

  constructor(request: XMLHttpRequest, response: E) {
    super(NetError.createErrorMessage(request));
    Object.setPrototypeOf(this, NetError.prototype);
    this.request = request;
    this.response = response;
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

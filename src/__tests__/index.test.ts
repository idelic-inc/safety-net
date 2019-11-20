import createXhr from 'test/xhrMock';

import net from '../';

jest.useFakeTimers();

describe('net', () => {
  test('exports an API of valid HTTP request methods.', () => {
    expect(net.get).toBeDefined();
    expect(net.post).toBeDefined();
    expect(net.delete).toBeDefined();
    expect(net.request).toBeDefined();
  });

  test('should make GET requests', () => {
    const xhr = createXhr();
    const promise = net
      .get('/test')
      .response.then(response => expect(response.data).toEqual({a: 1}));

    jest.runAllTimers();

    expect(xhr.open).toBeCalledWith('GET', '/test');
    expect(xhr.send).toBeCalled();

    xhr.status = 200;
    xhr.response = {a: 1};
    xhr.trigger('loadend');

    return promise;
  });

  test('should make POST requests', () => {
    const xhr = createXhr();
    const options = {
      headers: {'content-type': 'application/json'},
      body: {a: 2}
    };
    const promise = net
      .post('/test', options)
      .response.then(response => expect(response.data).toEqual({a: 1}));

    jest.runAllTimers();

    expect(xhr.open).toBeCalledWith('POST', '/test');
    expect(xhr.send).toBeCalledWith(JSON.stringify({a: 2}));

    xhr.status = 200;
    xhr.response = {a: 1};
    xhr.trigger('loadend');

    return promise;
  });

  test('should make DELETE requests', () => {
    const xhr = createXhr();
    const promise = net
      .delete('/test/1')
      .response.then(response => expect(response.data).not.toBeDefined());

    jest.runAllTimers();

    expect(xhr.open).toBeCalledWith('DELETE', '/test/1');
    expect(xhr.send).toBeCalledWith(null);

    xhr.status = 200;
    xhr.trigger('loadend');

    return promise;
  });

  test('should allow query params', () => {
    const xhr = createXhr();
    const promise = net.get('/test', {
      query: [
        ['a', '1'],
        ['b', '2']
      ]
    }).response;
    jest.runAllTimers();
    expect(xhr.open).toBeCalledWith('GET', '/test?a=1&b=2');
    xhr.status = 200;
    xhr.trigger('loadend');
    return promise;
  });

  test('should throw an error on a response with a 0 status', () => {
    const xhr = createXhr();
    const p = net
      .get('/test')
      .response.then(() => {
        throw new Error('GET request should fail');
      })
      .catch(err => expect(err).toBeDefined());

    jest.runAllTimers();

    xhr.status = 0;
    xhr.trigger('loadend');

    return p;
  });

  test('should throw an error on a response with a 4XX status', () => {
    const xhr = createXhr();
    const p = net
      .get('/test')
      .response.then(() => {
        throw Error('GET request should fail');
      })
      .catch(err => expect(err).toBeDefined());

    jest.runAllTimers();

    xhr.status = 400;
    xhr.trigger('loadend');

    return p;
  });

  test('should throw an error on a response with a 5XX status', () => {
    const xhr = createXhr();
    const p = net
      .get('/test')
      .response.then(() => {
        throw Error('GET request should fail');
      })
      .catch(err => expect(err).toBeDefined());

    jest.runAllTimers();

    xhr.status = 500;
    xhr.trigger('loadend');

    return p;
  });

  test('should throw an error on a response with a 6XX status', () => {
    const xhr = createXhr();
    const p = net
      .get('/test')
      .response.then(() => {
        throw Error('GET request should fail');
      })
      .catch(err => expect(err).toBeDefined());

    jest.runAllTimers();

    xhr.status = 600;
    xhr.trigger('loadend');

    return p;
  });
});

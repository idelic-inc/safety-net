type Callback = (data: any) => void;

export default function createXHRmock(): any {
  const api: any = {};
  const fns: Record<string, Callback> = {};

  api.setRequestHeader = jest.fn();
  api.open = jest.fn();
  api.send = jest.fn();
  api.addEventListener = jest.fn((name, fn) => fns[name] = fn);
  api.trigger = (name: string, data: any) => fns[name](data);

  const xhrMockClass = function () {
    return api;
  };

  // @ts-ignore
  window.XMLHttpRequest = jest.fn(xhrMockClass);

  return api;
}


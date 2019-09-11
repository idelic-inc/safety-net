type Resolver<T> = (value: T) => void;
type Rejector = (error: Error) => void;
type Executor<T> = (resolver: Resolver<T>, rejector: Rejector) => void;
type Canceller = () => void;

export class CancellablePromise<T> {
  _executor: Executor<T>;
  _canceller: Canceller;
  _promise: Promise<T>;
  _rejector: Rejector = () => {};
  _completed = false;

  constructor(executor: Executor<T>, canceller: Canceller) {
    this._executor = executor;
    this._canceller = canceller;
    this._promise = new Promise(this._execute);
  }

  cancel = (): void => {
    if (!this._completed) {
      this._completed = true;
      this._canceller();
    }
  };

  _execute = (resolve: Resolver<T>, reject: Rejector): void => {
    this._rejector = reject;
    if (!this._completed) {
      this._executor(this._resolve(resolve), this._reject(reject));
    }
  };

  _resolve = (resolver: Resolver<T>) => (value: T) => {
    if (!this._completed) {
      this._completed = true;
      resolver(value);
    }
  };

  _reject = (rejector: Rejector) => (error: Error) => {
    if (!this._completed) {
      this._completed = true;
      rejector(error);
    }
  };
}

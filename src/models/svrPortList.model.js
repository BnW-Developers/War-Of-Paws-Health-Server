export class svrPortListModel {
  #svrPort;
  constructor() {
    this.#svrPort = new Map();
  }

  getPorts() {
    return this.#svrPort.values();
  }

  find(ip) {
    return this.#svrPort.get(ip);
  }

  set(ip, port) {
    this.#svrPort.set(ip, port);
  }

  delete(ip) {
    if (this.#svrPort.has(ip)) this.#svrPort.delete(ip);
  }
}

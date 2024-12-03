export class svrListModel {
  #svrList;
  constructor() {
    this.#svrList = new Map();
  }

  get() {
    return Object.entries(this.#svrList);
  }

  has(ip) {
    return this.#svrList.has(ip);
  }

  set(ip, infos) {
    this.#svrList.set(ip, infos);
    const verification = this.#svrList.get(ip);
    if (verification === infos) return true;
  }

  find(ip) {
    return this.#svrList.get(ip);
  }

  delete(ip) {
    if (this.#svrList.has(ip)) this.#svrList.delete(ip);
  }
}

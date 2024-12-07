import { loadSvrFromJson } from '../utils/util/svrJson.js';

export class SvrListModel {
  constructor() {
    if (SvrListModel.instance instanceof SvrListModel) return SvrListModel.instance;
    SvrListModel.instance = this;
    this.svrList = new Map();
  }

  async init() {
    await loadSvrFromJson(this.svrList);
  }

  get() {
    return this.svrList;
  }

  getPorts() {
    return Array.from(this.svrList.values(), ({ nginxPort }) => nginxPort);
  }

  getMaxPorts() {
    const ports = this.getPorts();
    return ports.length > 0 ? Math.max(...ports) : 4999;
  }

  has(ip) {
    return this.svrList.has(ip);
  }

  set(ip, infos) {
    this.svrList.set(ip, infos);
    const verification = this.svrList.get(ip);
    if (verification === infos) return true;
  }

  find(ip) {
    return this.svrList.get(ip);
  }

  findPort(ip) {
    return this.svrList.get(ip).nginxPort;
  }

  delete(ip) {
    if (this.svrList.has(ip)) this.svrList.delete(ip);
  }
}

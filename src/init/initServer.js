import checkSvrService from '../services/checkSvr.services.js';
import { SvrListModel } from '../models/svrList.model.js';

export const initServer = async () => {
  try {
    await new SvrListModel().init();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

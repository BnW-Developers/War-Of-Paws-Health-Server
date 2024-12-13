import checkSvrService from '../services/checkSvr.services.js';

export class CheckController {
  #chkSvrService;
  constructor() {
    console.log('checkController 인스턴스 생성');
    this.#chkSvrService = new checkSvrService();
  }

  // 모니터링용 메서드
  getSvrStatus = (_, res, next) => {
    try {
      const serverStatus = this.#chkSvrService.getSvrStatus();
      return res.status(200).json({ serverStatus });
    } catch (err) {
      next(err);
    }
  };

  // 게임서버 실시간 상태체크용
  setSvrStatus = async (req, res, next) => {
    try {
      const { ip, cpuUsage, memUsage, sessionCnt } = req.body;
      const result = await this.#chkSvrService.setSvrStatus(ip, cpuUsage, memUsage, sessionCnt);

      return res.status(200).json({ message: '성공적으로 서버 정보가 입력되었습니다.' });
    } catch (err) {
      next(err);
    }
  };

  // 매칭서버용
  getAvailableSvr = async (req, res, next) => {
    try {
      const { users } = req.body;
      const svrPort = await this.#chkSvrService.getAvailableSvr(users);
      return res.status(200).json({ svrPort });
    } catch (err) {
      next(err);
    }
  };
}

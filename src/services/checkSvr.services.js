import { svrListModel } from '../models/svrList.model.js';
import { svrPortListModel } from '../models/svrPortList.model.js';
import CustomErr from '../utils/error/CustomErr.js';
import logger from '../utils/log/logger.js';

class checkSvrService {
  #svrListModel;
  #svrPortListModel;
  constructor() {
    this.#svrListModel = new svrListModel();
    this.#svrPortListModel = new svrPortListModel();
    this.lowServer = null;
    this.lowCnt = Infinity;
    this.portNum = 5000;
  }

  // 모니터링용 서비스
  getSvrStatus() {
    const svrList = this.#svrListModel.get();

    if (svrList) {
      const svrData = [];

      for (const [svrIp, { cpuUsage, memUsage, sessionCnt }] of svrList) {
        const svrPort = this.#svrPortListModel.find(svrIp);
        svrData.push({
          svrIp,
          svrPort,
          cpuUsage,
          memUsage,
          sessionCnt,
        });
      }

      return svrData;
    }

    return [];
  }

  // 게임서버 헬스체크용 서비스
  setSvrStatus(ip, cpuUsage, memUsage, sessionCnt) {
    const ipAddress = ip.split('.');
    const incorrectIp = ipAddress.some((ip) => ip < 0 || ip > 255);
    const incorrectCpu = cpuUsage > 100 || cpuUsage < 0;
    const incorrectMem = memUsage > 100 || memUsage < 0;

    if (ipAddress.length < 4 || incorrectIp)
      throw new CustomErr('아이피 형식이 올바르지 않습니다.', 400);
    if (incorrectCpu || incorrectMem)
      throw new CustomErr('서버 입력 정보가 올바르지 않습니다.', 400);
    if (!this.#svrListModel.has(ip)) this.setSvrPort(ip, this.portNum++);
    const result = this.#svrListModel.set(ip, { cpuUsage, memUsage, sessionCnt });
    if (!result) throw new CustomErr('서버 정보 입력에 실패하였습니다.', 500);
    if (ip === this.lowServer && sessionCnt !== this.lowCnt) {
      this.lowCnt = sessionCnt;
    } else if (cpuUsage < 90 && memUsage < 90 && sessionCnt < this.lowCnt) {
      this.lowServer = ip;
      this.lowCnt = sessionCnt;
    }
    logger.info(`${ip} - cpu: ${cpuUsage} %, mem: ${memUsage}, sessionCnt: ${sessionCnt}`);
  }

  // 게임서버 최초 등재시 포트 기록
  setSvrPort(ip, port) {
    const ipAddress = ip.split('.');
    const incorrectIp = ipAddress.some((ip) => ip < 0 || ip > 255);
    const incorrectPort = port < 1 || port > 65535;

    if (incorrectIp || incorrectPort)
      throw new CustomErr('서버 입력 정보가 올바르지 않습니다.', 400);

    const ports = [...this.#svrPortListModel.getPorts()];
    const verification = ports.some((savedPort) => savedPort === port);

    if (verification) throw new CustomErr('중복 포트입니다.', 400);

    this.#svrPortListModel.set(ip, port);
    logger.info(`nginx ${port}번 포트에 ${ip}:가 매핑되었습니다.`);
    // TODO: nginx에 포트 정보 넘기기
  }

  // 매칭서버 요청 관련 현재 기준 least 서버 반환 서비스
  getAvailableSvr(users) {
    if (!this.lowServer) {
      // TODO: 게임서버 증설 메커니즘
      // TODO: 디스코드 봇 연동
      throw new CustomErr('실행 가능한 서버가 없습니다.', 501);
    }

    const cpuUsage = this.#svrListModel.find(this.lowServer).cpuUsage;
    const memUsage = this.#svrListModel.find(this.lowServer).memUsage;
    const availableStatus = cpuUsage < 90 && memUsage < 90;

    if (!availableStatus) {
      // TODO: 게임서버 증설 메커니즘
      // TODO: 디스코드 봇 연동
      throw new CustomErr('실행 가능한 서버가 없습니다.', 500);
    }

    // TODO: 게임서버에 유저 토큰 전달
    logger.info(`[match] 유저 토큰정보를 ${this.lowServer} 서버로 이첩 하달하였습니다.`);

    return this.#svrPortListModel.find(this.lowServer);
  }
}

export default checkSvrService;

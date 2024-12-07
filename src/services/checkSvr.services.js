import { config } from '../config/config.js';
import { SvrListModel } from '../models/svrList.model.js';
import { hashed } from '../utils/auth/hashed.util.js';
import CustomErr from '../utils/error/CustomErr.js';
import logger from '../utils/log/logger.js';
import { writeSvrToJson } from '../utils/util/svrJson.js';

class checkSvrService {
  #svrListModel;
  constructor() {
    this.#svrListModel = new SvrListModel();
    this.lowServer = null;
    this.lowCnt = Infinity;
  }

  // 모니터링용 서비스
  getSvrStatus() {
    const svrList = this.#svrListModel.get();

    if (svrList) {
      const svrData = [];

      for (const [svrIp, { nginxPort, cpuUsage, memUsage, sessionCnt }] of svrList) {
        svrData.push({
          svrIp,
          nginxPort,
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
  async setSvrStatus(ip, cpuUsage, memUsage, sessionCnt) {
    const ipAddress = ip.split('.');
    const incorrectIp = ipAddress.some((ip) => ip < 0 || ip > 255);
    const incorrectCpu = cpuUsage > 100 || cpuUsage < 0;
    const incorrectMem = memUsage > 100 || memUsage < 0;

    if (ipAddress.length < 4 || incorrectIp)
      throw new CustomErr('아이피 형식이 올바르지 않습니다.', 400);
    if (incorrectCpu || incorrectMem)
      throw new CustomErr('서버 입력 정보가 올바르지 않습니다.', 400);

    let result;
    // 서버 리스트에 없을 경우 새로 등록
    if (!this.#svrListModel.has(ip)) {
      let nginxPort = this.#svrListModel.getMaxPorts();
      ++nginxPort;
      result = this.#svrListModel.set(ip, {
        nginxPort,
        cpuUsage,
        memUsage,
        sessionCnt,
      });
      writeSvrToJson(ip, nginxPort);
      // nginx 서버 등록
      this.setSvrPort(ip, nginxPort);
    }
    // 서버 리스트 최신화
    else {
      result = this.#svrListModel.find(ip);
      result.cpuUsage = cpuUsage;
      result.memUsage = memUsage;
      result.sessionCnt = sessionCnt;
    }

    if (!result) throw new CustomErr('서버 정보 입력에 실패하였습니다.', 500);
    // lowServer 카운트 최신화
    if (ip === this.lowServer && sessionCnt !== this.lowCnt) {
      this.lowCnt = sessionCnt;
    }
    // 세션량 적은 서버 최신화
    else if (cpuUsage < 70 && memUsage < 70 && sessionCnt < this.lowCnt) {
      this.lowServer = ip;
      this.lowCnt = sessionCnt;
    }
    logger.info(`${ip} - cpu: ${cpuUsage} %, mem: ${memUsage}, sessionCnt: ${sessionCnt}`);
  }

  // 게임서버 최초 등재시 nginx 서버 등록용
  async setSvrPort(ip, port) {
    const url = 'http://10.178.0.7:13571/config/serverList';
    const key = await hashed(config.auth.key);
    const data = {
      ip,
      port,
    };

    const response = await fetch(url, {
      method: 'POST', // HTTP 메서드: POST
      headers: {
        'Content-Type': 'application/json', // JSON 데이터 전송
        authorization: key,
      },
      body: JSON.stringify(data), // 데이터를 JSON 문자열로 변환하여 전송
    });

    if (!response.ok) throw new CustomErr(`서버오류`, 500);
    logger.info(`nginx ${port}번 포트에 ${ip}:가 매핑되었습니다.`);
  }
  // nginx 서버 포트 삭제용
  async deleteSvrPort(port) {
    const url = 'http://10.178.0.7:13571/config/serverList';
    const key = await hashed(config.auth.key);
    const data = {
      port,
    };

    const response = await fetch(url, {
      method: 'DELETE', // HTTP 메서드: POST
      headers: {
        'Content-Type': 'application/json', // JSON 데이터 전송
        authorization: key,
      },
      body: JSON.stringify(data), // 데이터를 JSON 문자열로 변환하여 전송
    });

    if (!response.ok) throw new CustomErr(`서버오류`, 500);
    logger.info(`nginx ${port}번 포트가 삭제되었습니다.`);
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
    const availableStatus = cpuUsage < 70 && memUsage < 70;

    if (!availableStatus) {
      // TODO: 게임서버 증설 메커니즘
      // TODO: 디스코드 봇 연동
      throw new CustomErr('실행 가능한 서버가 없습니다.', 500);
    }

    // TODO: 게임서버에 유저 토큰 전달
    logger.info(`[match] 유저 토큰정보를 ${this.lowServer} 서버로 이첩 하달하였습니다.`);

    return this.#svrListModel.findPort(this.lowServer);
  }
}

export default checkSvrService;

import { config } from '../config/config.js';
import { SvrListModel } from '../models/svrList.model.js';
import { hashed } from '../utils/auth/hashed.util.js';
import CustomErr from '../utils/error/CustomErr.js';
import logger from '../utils/log/logger.js';
import { discordAlert } from '../utils/util/discordAlert.js';
import { deleteSvrFromJson, writeSvrToJson } from '../utils/util/svrJson.js';

class checkSvrService {
  #svrListModel;
  constructor() {
    this.#svrListModel = new SvrListModel();
    this.lowServer = null;
    this.lowCnt = Infinity;
    this.interval = setInterval(this.checkDeadSvr.bind(this), 1000);
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
      // nginx 서버 등록
      await this.setSvrPort(ip, nginxPort);
      await writeSvrToJson(ip, nginxPort);
      result = this.#svrListModel.set(ip, {
        nginxPort,
        cpuUsage,
        memUsage,
        sessionCnt,
        timeStamp: Date.now(),
      });
    }
    // 서버 리스트 최신화
    else {
      result = this.#svrListModel.find(ip);
      result.cpuUsage = cpuUsage;
      result.memUsage = memUsage;
      result.sessionCnt = sessionCnt;
      result.timeStamp = Date.now();
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

  // 주기적 상태 데이터를 받지 못한 서버 삭제용
  async checkDeadSvr() {
    try {
      // 서버리스트 불러옴
      const svrList = this.#svrListModel.get();
      if (!svrList) return;
      // 서버 리스트 타임스탬프 검사
      for (const [svrIp, infos] of svrList) {
        const now = Date.now();
        const lastNoti = infos.timeStamp;
        if (!lastNoti) infos.timeStamp = Date.now();
        if (now - lastNoti > 10000) {
          // 해당 서버 lowServer인지 검사
          if (this.lowServer === svrIp) {
            this.lowServer = null;
            this.lowCnt = Infinity;
          }
          // 삭제 처리
          await this.deleteSvrPort(infos.nginxPort);
          await deleteSvrFromJson(svrIp);
          this.#svrListModel.delete(svrIp);

          // 알림
          discordAlert(`${svrIp} - 서버가 장시간 보고되지 않아 nginx 매핑 삭제 처리되었습니다.`);
          logger.info(`${svrIp} - 장시간 보고되지 않아 삭제 처리`);
        }
      }
    } catch (err) {
      console.error(err.message);
    }
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
    discordAlert(`nginx 서버 ${port}번 포트에 ${ip}:가 매핑되었습니다.`);
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
  async getAvailableSvr(users) {
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

    await this.sendMatchInfo(users, this.lowServer);
    logger.info(`[match] 유저 정보를 ${this.lowServer} 서버로 이첩 하달하였습니다.`);

    return this.#svrListModel.findPort(this.lowServer);
  }
  // 게임서버 매칭정보 전달용
  async sendMatchInfo(users, ip) {
    const url = `http://${ip}:13571/gameSession`;
    const key = await hashed(config.auth.key);
    const data = {
      users,
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
  }
}

export default checkSvrService;

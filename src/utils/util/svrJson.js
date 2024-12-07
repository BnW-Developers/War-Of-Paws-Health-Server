import fs from 'fs';
import { Mutex } from 'async-mutex';
const path = 'json/svr.json';
const lock = new Mutex();
export const getSvrJson = async () => {
  try {
    // json 없으면 null 반환
    if (!fs.existsSync(path)) return null;
    const svrData = fs.readFileSync(path, 'utf-8');
    const json = JSON.parse(svrData);
    return json;
  } catch (err) {
    console.error(err.message);
  }
};

export const loadSvrFromJson = async (map) => {
  try {
    await lock.acquire();
    if (typeof map !== 'object') throw new Error('인자 설정 잘못한듯? - loadSvrJson');
    const svrData = await getSvrJson();
    if (!svrData) return null;

    for (const [svrIp, svrPort] of Object.entries(svrData)) {
      map.set(svrIp, svrPort);
    }
  } catch (err) {
    console.error(err.message);
  } finally {
    lock.release();
  }
};

export const writeSvrToJson = async (svrIp, svrPort) => {
  try {
    await lock.acquire();
    let svrData = await getSvrJson();
    if (!svrData) svrData = {};

    if (svrData[svrIp]) throw new Error('서버 아이피 중복');

    svrData[svrIp] = { nginxPort: svrPort };
    fs.writeFileSync(path, JSON.stringify(svrData));
  } catch (err) {
    console.error(err.message);
  } finally {
    lock.release();
  }
};

export const deleteSvrFromJson = async (svrIp) => {
  try {
    await lock.acquire();
    let svrData = await getSvrJson();
    if (!svrData || !svrData[svrIp]) throw new Error('삭제할 아이피가 목록에 없음');
    delete svrData[svrIp];
    fs.writeFileSync(path, JSON.stringify(svrData));
  } catch (err) {
    console.error(err.message);
  } finally {
    lock.release();
  }
};

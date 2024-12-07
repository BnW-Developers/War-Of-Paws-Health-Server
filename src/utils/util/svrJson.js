import fs from 'fs';

const path = 'json/svr.json';

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
    if (typeof map !== 'object') throw new Error('인자 설정 잘못한듯? - loadSvrJson');
    const svrData = await getSvrJson();
    if (!svrData) return null;

    for (const [svrIp, svrPort] of Object.entries(svrData)) {
      map.set(svrIp, svrPort);
    }
  } catch (err) {
    console.error(err.message);
  }
};

export const writeSvrToJson = async (svrIp, svrPort) => {
  try {
    let svrData = await getSvrJson();
    if (!svrData) svrData = {};

    if (svrData[svrIp]) throw new Error('서버 아이피 중복');

    svrData[svrIp] = { nginxPort: svrPort };
    fs.writeFileSync(path, JSON.stringify(svrData));
  } catch (err) {
    console.error(err.message);
  }
};

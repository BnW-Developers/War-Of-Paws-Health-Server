# War-Of-Paws-Health-Server
----
![image](https://github.com/user-attachments/assets/120f813d-548c-4692-8880-142f8d64941d)

## 소개
War-Of-Paws-Health-Server는 War of Paws 게임 서버의 상태를 모니터링하고 관리하는 서버입니다. 
게임서버의 상태를 수시로 체크하고 서버 정보를 nginx에 API 요청하여 포트 매핑 업데이트하며 
매칭 서버의 요청에 따른 가용 게임서버 포트 제공 및 게임서버에게 매칭 클라이언트 정보를 전달합니다.

- 🕹️ [냥멍대전 게임서버](https://github.com/BnW-Developers/War-Of-Paws-Game-Server)  
- 🔑 [냥멍대전 인증서버](https://github.com/BnW-Developers/War-Of-Paws-Auth-Server)  
- 🎯 [로비-매칭서버](https://github.com/BnW-Developers/War-Of-Paws-Lobby-Matching-Server)  
- 💊 [Nginx-헬퍼 서버](https://github.com/BnW-Developers/Nginx-Helper-Server)  
- ✅ [헬스체크 서버](https://github.com/BnW-Developers/War-Of-Paws-Health-Server)  

## 프로젝트 코드 플로우
![image](https://github.com/user-attachments/assets/e2613aa4-52d6-48a9-aab7-db2fc16d50d2)

## 주요 기능

- **게임서버 상태체크 및 업데이트**: 5초 주기로 들어오는 게임서버의 상태 보고를 수시 체크하며 일정시간 보고가 들어오지 않는 경우 nginx-helper 서버에 포트해제 요청 및 discord 서버로 알림 요청을 진행합니다.
- **게임서버 로드밸런싱**: 매칭 서버에서 가용서버 요청에 따라 현재 등록된 서버 중 원활한 서버의 포트를 제공하고 매칭 정보를 해당 게임서버에 전달합니다.
  
## 주요 API
모든 API 요청은 auth.middleware.js를 통해 인증됩니다. 요청 헤더에 authorization 키를 포함해야 합니다.

`{ authorization : API_KEY(hash)}`

### 1. 서버 상태체크 및 업데이트
**GET /check/svrStatus**  - 서버 상태리스트 요청 ( 추후 모니터링 페이지용 )
요청 예시:
```
{}
```
응답 예시:
```
{ serverStatus }
```

**POST /check/svrStatus** - 게임서버 상태보고 
요청 예시:
```
{ ip, cpuUsage, memUsage, sessionCnt }
```
응답 예시:
```
{ message: '성공적으로 서버 정보가 입력되었습니다.' }
```

**POST /check/availableSvr** - 매칭 시 가용한 게임서버 포트 요청
요청 예시:
```
{ users : [{userId,species} , {userId,species}]} // 매칭된 유저 정보 (게임서버 전달용)
```
응답 예시:
```
{ svrPort }
```
---

### 기술 스택
<img src="https://shields.io/badge/JavaScript-F7DF1E?logo=JavaScript&logoColor=000&style=flat-square" style="height : 25px; margin-left : 10px; margin-right : 10px;"/>&nbsp;
<img src="https://shields.io/badge/Node.js-339933?logo=Node.js&logoColor=fff&style=flat-square" style="height : 25px; margin-left : 10px; margin-right : 10px;"/>&nbsp;
<img src="https://shields.io/badge/Express-000000?logo=Express&logoColor=fff&style=flat-square" style="height : 25px; margin-left : 10px; margin-right : 10px;"/>&nbsp;

### 인증
<img src="https://shields.io/badge/JWT-000000?logo=JSONWebTokens&logoColor=fff&style=flat-square" style="height : 25px; margin-left : 10px; margin-right : 10px;"/>&nbsp;
<img src="https://shields.io/badge/BCRYPT-3C873A?logo=OAuth&logoColor=fff&style=flat-square" style="height : 25px; margin-left : 10px; margin-right : 10px;"/>&nbsp;

### DevOps
<img src="https://shields.io/badge/Docker-2496ED?logo=Docker&logoColor=fff&style=flat-square" style="height : 25px; margin-left : 10px; margin-right : 10px;"/>&nbsp;

### 배포 환경
<img src="https://shields.io/badge/GCP-4285F4?logo=GoogleCloud&logoColor=fff&style=flat-square" style="height : 25px; margin-left : 10px; margin-right : 10px;"/>&nbsp;

## 프로젝트 구조
```
📦src
 ┣ 📂config
 ┃ ┗ 📜config.js
 ┣ 📂constants
 ┃ ┗ 📜env.js
 ┣ 📂controllers
 ┃ ┗ 📜check.controller.js
 ┣ 📂init
 ┃ ┗ 📜initServer.js
 ┣ 📂middlewares
 ┃ ┣ 📜auth.middleware.js
 ┃ ┗ 📜error-handling.middleware.js
 ┣ 📂models
 ┃ ┗ 📜svrList.model.js
 ┣ 📂routes
 ┃ ┣ 📜check.router.js
 ┃ ┗ 📜index.router.js
 ┣ 📂services
 ┃ ┗ 📜checkSvr.services.js
 ┣ 📂utils
 ┃ ┣ 📂auth
 ┃ ┃ ┣ 📜checkHashed.util.js
 ┃ ┃ ┗ 📜hashed.util.js
 ┃ ┣ 📂error
 ┃ ┃ ┗ 📜CustomErr.js
 ┃ ┣ 📂fommatter
 ┃ ┃ ┗ 📜timeFormatter.js
 ┃ ┣ 📂log
 ┃ ┃ ┗ 📜logger.js
 ┃ ┗ 📂util
 ┃ ┃ ┣ 📜discordAlert.js
 ┃ ┃ ┗ 📜svrJson.js
 ┗ 📜server.js
 ```

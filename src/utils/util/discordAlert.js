import { Client, GatewayIntentBits } from 'discord.js';
import { config } from '../../config/config.js';

// 디스코드 클라이언트 생성
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// 봇 토큰과 채널 ID 설정
const BOT_TOKEN = config.discord.token;
const CHANNEL_ID = config.discord.channelId;

// 디스코드 알림 함수
export const discordAlert = (message) => {
  const channel = client.channels.cache.get(CHANNEL_ID);
  if (channel) {
    channel.send(message);
  } else {
    console.error('알림 채널을 찾을 수 없습니다.');
  }
};

// 봇 로그인
client.login(BOT_TOKEN);

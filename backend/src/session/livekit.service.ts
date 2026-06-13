import { Injectable } from '@nestjs/common';
import { AccessToken } from 'livekit-server-sdk';

@Injectable()
export class LivekitService {
  private apiKey = process.env.LIVEKIT_API_KEY;
  private apiSecret = process.env.LIVEKIT_API_SECRET;
  private wsUrl = process.env.LIVEKIT_WS_URL;

  generateToken(roomName: string, participantName: string, metadata?: string) {
    const at = new AccessToken(this.apiKey, this.apiSecret, {
      identity: participantName,
      metadata,
    });
    at.addGrant({ roomJoin: true, room: roomName, canPublish: true, canSubscribe: true });
    return at.toJwt();
  }

  getWsUrl() {
    return this.wsUrl;
  }
}

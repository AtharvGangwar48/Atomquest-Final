import { Injectable } from '@nestjs/common';
import { AccessToken } from 'livekit-server-sdk';

@Injectable()
export class LivekitService {
  private apiKey = process.env.LIVEKIT_API_KEY || 'devkey';
  private apiSecret = process.env.LIVEKIT_API_SECRET || 'secret';
  private wsUrl = process.env.LIVEKIT_WS_URL || 'ws://localhost:7880';

  generateToken(roomName: string, participantName: string, metadata?: string) {
    if (!this.apiKey || !this.apiSecret) {
      console.error('LiveKit credentials missing!');
    }
    const at = new AccessToken(this.apiKey, this.apiSecret, {
      identity: participantName,
      metadata,
    });
    at.addGrant({ 
      roomJoin: true, 
      room: roomName, 
      canPublish: true, 
      canPublishData: true,
      canSubscribe: true 
    });
    return at.toJwt();
  }

  getWsUrl() {
    console.log('LiveKit WS URL:', this.wsUrl);
    return this.wsUrl;
  }

  getApiKey() {
    return this.apiKey;
  }

  getApiSecret() {
    return this.apiSecret;
  }
}

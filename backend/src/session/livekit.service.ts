import { Injectable } from '@nestjs/common';
import { AccessToken } from 'livekit-server-sdk';

@Injectable()
export class LivekitService {
  private apiKey = process.env.LIVEKIT_API_KEY || 'devkey';
  private apiSecret = process.env.LIVEKIT_API_SECRET || 'secret';
  private wsUrl = process.env.LIVEKIT_WS_URL || 'ws://localhost:7880';

  async generateToken(roomName: string, participantName: string, metadata?: string) {
    const key = this.apiKey;
    const secret = this.apiSecret;
    console.log('[LiveKit] apiKey:', key?.substring(0, 8), '| wsUrl:', this.wsUrl);
    if (!key || !secret || key === 'devkey') {
      throw new Error(`LiveKit credentials missing or still using devkey. Set LIVEKIT_API_KEY on Render.`);
    }
    const identity = `${participantName}-${Math.random().toString(36).substr(2, 9)}`;
    const at = new AccessToken(this.apiKey, this.apiSecret, {
      identity,
      name: participantName,
      metadata,
    });
    at.addGrant({ 
      roomJoin: true, 
      room: roomName, 
      canPublish: true, 
      canPublishData: true,
      canSubscribe: true 
    });
    const token = await at.toJwt();
    console.log('Token generated successfully:', token.substring(0, 50));
    return token;
  }

  getWsUrl() {
    return this.wsUrl;
  }

  getApiKey() {
    return this.apiKey;
  }

  getApiSecret() {
    return this.apiSecret;
  }
}

/**
 * Service WebRTC P2P Souverain pour Le Monde à Vous
 * Gère la négociation de signalisation (Offer, Answer, ICE Candidates),
 * la configuration STUN/TURN résiliente et les flux audio/vidéo directs.
 */

// Configuration ICE avec serveurs STUN publics mondiaux haute disponibilité
export const RTC_ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun.cloudflare.com:3478' }
];

export interface WebRTCConnectionConfig {
  onRemoteStream?: (stream: MediaStream) => void;
  onIceCandidate?: (candidate: RTCIceCandidate) => void;
  onConnectionStateChange?: (state: RTCPeerConnectionState) => void;
}

export class WebRTCPeerManager {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private config: WebRTCConnectionConfig;

  constructor(config: WebRTCConnectionConfig = {}) {
    this.config = config;
  }

  /**
   * Initialise une connexion RTCPeerConnection avec gestionnaires d'événements
   */
  public initializePeer(localStream?: MediaStream): RTCPeerConnection {
    this.close();

    const pc = new RTCPeerConnection({
      iceServers: RTC_ICE_SERVERS,
      iceCandidatePoolSize: 10
    });

    this.peerConnection = pc;

    if (localStream) {
      this.localStream = localStream;
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
      });
    }

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        this.config.onRemoteStream?.(event.streams[0]);
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.config.onIceCandidate?.(event.candidate);
      }
    };

    pc.onconnectionstatechange = () => {
      this.config.onConnectionStateChange?.(pc.connectionState);
    };

    return pc;
  }

  /**
   * Crée une offre SDP pour initier un appel
   */
  public async createOffer(): Promise<RTCSessionDescriptionInit | null> {
    if (!this.peerConnection) return null;
    const offer = await this.peerConnection.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true
    });
    await this.peerConnection.setLocalDescription(offer);
    return offer;
  }

  /**
   * Répond à une offre SDP distante
   */
  public async createAnswer(offerSdp: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit | null> {
    if (!this.peerConnection) return null;
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offerSdp));
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    return answer;
  }

  /**
   * Reçoit la réponse SDP du correspondant
   */
  public async handleAnswer(answerSdp: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection) return;
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answerSdp));
  }

  /**
   * Ajoute un candidat ICE reçu du réseau de signalisation
   */
  public async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (!this.peerConnection) return;
    try {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (e) {
      console.warn("Erreur ajout ICE candidate WebRTC:", e);
    }
  }

  /**
   * Ferme et nettoie proprement la session WebRTC
   */
  public close(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
  }

  public getPeerConnection(): RTCPeerConnection | null {
    return this.peerConnection;
  }
}

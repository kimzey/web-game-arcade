// P2P Connection Manager using WebRTC
export type ConnectionStatus = "disconnected" | "connecting" | "connected" | "failed"
export type PeerMessage = {
  type: string
  data: any
}

export class P2PConnection {
  private peerConnection: RTCPeerConnection | null = null
  private dataChannel: RTCDataChannel | null = null
  private onMessageCallback: ((message: PeerMessage) => void) | null = null
  private onStatusChangeCallback: ((status: ConnectionStatus) => void) | null = null
  private status: ConnectionStatus = "disconnected"

  constructor() {
    this.setStatus("disconnected")
  }

  private setStatus(status: ConnectionStatus) {
    this.status = status
    if (this.onStatusChangeCallback) {
      this.onStatusChangeCallback(status)
    }
  }

  onMessage(callback: (message: PeerMessage) => void) {
    this.onMessageCallback = callback
  }

  onStatusChange(callback: (status: ConnectionStatus) => void) {
    this.onStatusChangeCallback = callback
  }

  getStatus(): ConnectionStatus {
    return this.status
  }

  async createOffer(): Promise<string> {
    this.setStatus("connecting")

    this.peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun1.l.google.com:19302" }],
    })

    // Create data channel
    this.dataChannel = this.peerConnection.createDataChannel("game-channel")
    this.setupDataChannel(this.dataChannel)

    // Handle ICE candidates
    const iceCandidates: RTCIceCandidate[] = []

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        iceCandidates.push(event.candidate)
      }
    }

    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection?.connectionState
      if (state === "connected") {
        this.setStatus("connected")
      } else if (state === "failed" || state === "disconnected") {
        this.setStatus("failed")
      }
    }

    const offer = await this.peerConnection.createOffer()
    await this.peerConnection.setLocalDescription(offer)

    // Wait for ICE gathering to complete
    await new Promise<void>((resolve) => {
      if (this.peerConnection?.iceGatheringState === "complete") {
        resolve()
      } else {
        this.peerConnection!.onicegatheringstatechange = () => {
          if (this.peerConnection?.iceGatheringState === "complete") {
            resolve()
          }
        }
      }
    })

    const offerData = {
      sdp: this.peerConnection.localDescription,
      candidates: iceCandidates,
    }

    return btoa(JSON.stringify(offerData))
  }

  async acceptOffer(offerString: string): Promise<string> {
    this.setStatus("connecting")

    try {
      const offerData = JSON.parse(atob(offerString))

      this.peerConnection = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun1.l.google.com:19302" }],
      })

      // Handle incoming data channel
      this.peerConnection.ondatachannel = (event) => {
        this.dataChannel = event.channel
        this.setupDataChannel(this.dataChannel)
      }

      const iceCandidates: RTCIceCandidate[] = []

      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          iceCandidates.push(event.candidate)
        }
      }

      this.peerConnection.onconnectionstatechange = () => {
        const state = this.peerConnection?.connectionState
        if (state === "connected") {
          this.setStatus("connected")
        } else if (state === "failed" || state === "disconnected") {
          this.setStatus("failed")
        }
      }

      await this.peerConnection.setRemoteDescription(offerData.sdp)

      // Add ICE candidates from offer
      for (const candidate of offerData.candidates) {
        await this.peerConnection.addIceCandidate(candidate)
      }

      const answer = await this.peerConnection.createAnswer()
      await this.peerConnection.setLocalDescription(answer)

      // Wait for ICE gathering
      await new Promise<void>((resolve) => {
        if (this.peerConnection?.iceGatheringState === "complete") {
          resolve()
        } else {
          this.peerConnection!.onicegatheringstatechange = () => {
            if (this.peerConnection?.iceGatheringState === "complete") {
              resolve()
            }
          }
        }
      })

      const answerData = {
        sdp: this.peerConnection.localDescription,
        candidates: iceCandidates,
      }

      return btoa(JSON.stringify(answerData))
    } catch (error) {
      this.setStatus("failed")
      throw error
    }
  }

  async acceptAnswer(answerString: string) {
    try {
      const answerData = JSON.parse(atob(answerString))

      if (!this.peerConnection) {
        throw new Error("No peer connection")
      }

      await this.peerConnection.setRemoteDescription(answerData.sdp)

      // Add ICE candidates from answer
      for (const candidate of answerData.candidates) {
        await this.peerConnection.addIceCandidate(candidate)
      }
    } catch (error) {
      this.setStatus("failed")
      throw error
    }
  }

  private setupDataChannel(channel: RTCDataChannel) {
    channel.onopen = () => {
      console.log("[v0] Data channel opened")
      this.setStatus("connected")
    }

    channel.onclose = () => {
      console.log("[v0] Data channel closed")
      this.setStatus("disconnected")
    }

    channel.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        if (this.onMessageCallback) {
          this.onMessageCallback(message)
        }
      } catch (error) {
        console.error("[v0] Failed to parse message:", error)
      }
    }
  }

  send(type: string, data: any) {
    if (this.dataChannel && this.dataChannel.readyState === "open") {
      this.dataChannel.send(JSON.stringify({ type, data }))
    }
  }

  disconnect() {
    if (this.dataChannel) {
      this.dataChannel.close()
    }
    if (this.peerConnection) {
      this.peerConnection.close()
    }
    this.setStatus("disconnected")
  }
}

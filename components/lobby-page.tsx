"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useGameStore } from "@/lib/game-store"
import { P2PConnection } from "@/lib/p2p-connection"
import { GameSelect } from "@/components/game-select"
import { Settings, Copy, Check } from "lucide-react"
import Link from "next/link"

let p2pConnection: P2PConnection | null = null

export function LobbyPage() {
  const [mode, setMode] = useState<"menu" | "host" | "join" | "single" | "waiting">("menu")
  const [inviteCode, setInviteCode] = useState("")
  const [joinCode, setJoinCode] = useState("")
  const [answerCode, setAnswerCode] = useState("")
  const [isConnected, setIsConnected] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [peerReady, setPeerReady] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  const { settings } = useGameStore()

  useEffect(() => {
    if (inviteCode && mode === "host") {
      copyToClipboard(inviteCode)
    }
  }, [inviteCode, mode])

  const handleCreateRoom = async () => {
    setIsGenerating(true)
    try {
      p2pConnection = new P2PConnection()

      p2pConnection.onStatusChange((status) => {
        console.log("[v0] Connection status:", status)
        if (status === "connected") {
          setIsConnected(true)
          setMode("waiting")
        } else if (status === "failed") {
          alert("การเชื่อมต่อล้มเหลว กรุณาลองใหม่อีกครั้ง")
          setMode("menu")
          setInviteCode("")
          setAnswerCode("")
        }
      })

      const offer = await p2pConnection.createOffer()
      setInviteCode(offer)
      setMode("host")
    } catch (error) {
      console.error("[v0] Failed to create room:", error)
      alert("ไม่สามารถสร้างห้องได้ กรุณาลองใหม่อีกครั้ง")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleJoinRoom = async () => {
    if (!joinCode.trim()) return

    setIsGenerating(true)
    try {
      p2pConnection = new P2PConnection()

      p2pConnection.onStatusChange((status) => {
        console.log("[v0] Connection status:", status)
        if (status === "connected") {
          setIsConnected(true)
          setMode("waiting")
        } else if (status === "failed") {
          alert("การเชื่อมต่อล้มเหลว กรุณาตรวจสอบรหัสและลองใหม่อีกครั้ง")
          setMode("menu")
          setJoinCode("")
          setAnswerCode("")
        }
      })

      const answer = await p2pConnection.acceptOffer(joinCode)
      setAnswerCode(answer)
      setMode("join")
    } catch (error) {
      console.error("[v0] Failed to join room:", error)
      alert("รหัสไม่ถูกต้อง กรุณาตรวจสอบและลองอีกครั้ง")
      setMode("menu")
      setJoinCode("")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleAcceptAnswer = async () => {
    if (!answerCode.trim() || !p2pConnection) return

    setIsGenerating(true)
    try {
      await p2pConnection.acceptAnswer(answerCode)
      console.log("[v0] Answer accepted, waiting for connection...")
    } catch (error) {
      console.error("[v0] Failed to accept answer:", error)
      alert("รหัสตอบกลับไม่ถูกต้อง กรุณาตรวจสอบและลองอีกครั้ง")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSinglePlayer = () => {
    setMode("single")
    setIsConnected(true)
  }

  const handleReady = () => {
    if (!isReady) {
      setIsReady(true)
      p2pConnection?.send("player-ready", { ready: true })
    }
  }

  useEffect(() => {
    if (p2pConnection && mode === "waiting") {
      p2pConnection.onMessage((message) => {
        if (message.type === "player-ready") {
          setPeerReady(message.data.ready)
        }
      })
    }
  }, [mode])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (isConnected && isReady && peerReady) {
    return (
      <GameSelect
        connection={p2pConnection}
        isSinglePlayer={false}
        onBack={() => {
          setMode("menu")
          setIsConnected(false)
          setIsReady(false)
          setPeerReady(false)
          p2pConnection?.disconnect()
        }}
      />
    )
  }

  if (isConnected && mode === "single") {
    return (
      <GameSelect
        connection={p2pConnection}
        isSinglePlayer={true}
        onBack={() => {
          setMode("menu")
          setIsConnected(false)
        }}
      />
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/10">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-5xl font-bold text-primary tracking-tight">Co-op Arcade</h1>
          <p className="text-muted-foreground">เล่นเดี่ยว หรือเล่นกับเพื่อน</p>
        </div>

        {mode === "menu" && (
          <Card className="p-8 space-y-6 border-2">
            <div className="space-y-3">
              <Button className="w-full h-14 text-lg font-semibold" onClick={handleSinglePlayer}>
                เล่นคนเดียว
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">หรือ</span>
                </div>
              </div>

              <Button
                className="w-full h-14 text-lg font-semibold"
                variant="secondary"
                onClick={handleCreateRoom}
                disabled={isGenerating}
              >
                {isGenerating ? "กำลังสร้างห้อง..." : "สร้างห้อง (เล่น 2 คน)"}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">หรือ</span>
                </div>
              </div>

              <div className="space-y-2">
                <Input
                  placeholder="ใส่รหัสห้องที่เพื่อนให้"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  className="h-12"
                />
                <Button
                  className="w-full h-12 font-semibold bg-transparent"
                  variant="outline"
                  onClick={handleJoinRoom}
                  disabled={!joinCode.trim() || isGenerating}
                >
                  {isGenerating ? "กำลังเข้าร่วม..." : "เข้าร่วมห้อง"}
                </Button>
              </div>
            </div>

            <div className="pt-4 border-t border-border space-y-3">
              <div className="text-sm text-muted-foreground">
                <p className="font-semibold text-foreground mb-2">เกมที่มี:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Co-op Pong - ตีบอลร่วมกัน</li>
                  <li>Co-op Snake - งูสองตัวเก็บอาหารด้วยกัน</li>
                  <li>Space Shooter - ยิงยานร่วมกัน</li>
                </ul>
              </div>

              <Link href="/settings">
                <Button variant="outline" className="w-full bg-transparent" size="lg">
                  <Settings className="mr-2 h-4 w-4" />
                  ตั้งค่า
                </Button>
              </Link>
            </div>
          </Card>
        )}

        {mode === "waiting" && isConnected && (
          <Card className="p-8 space-y-6 border-2">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">ล็อบบี้รอผู้เล่น</h2>
              <p className="text-sm text-muted-foreground">เชื่อมต่อสำเร็จ! รอผู้เล่นกดพร้อม</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                <span className="font-medium">คุณ ({settings.playerName})</span>
                {isReady ? (
                  <span className="text-green-500 font-semibold">✓ พร้อม</span>
                ) : (
                  <span className="text-muted-foreground">รอ...</span>
                )}
              </div>

              <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                <span className="font-medium">ผู้เล่น 2</span>
                {peerReady ? (
                  <span className="text-green-500 font-semibold">✓ พร้อม</span>
                ) : (
                  <span className="text-muted-foreground">รอ...</span>
                )}
              </div>
            </div>

            {!isReady ? (
              <Button className="w-full h-14 text-lg font-semibold" onClick={handleReady}>
                พร้อมเล่น!
              </Button>
            ) : (
              <div className="text-center">
                <p className="text-primary font-semibold animate-pulse">รอผู้เล่นอีกคนกดพร้อม...</p>
              </div>
            )}

            <Button
              variant="ghost"
              className="w-full"
              onClick={() => {
                p2pConnection?.disconnect()
                setMode("menu")
                setInviteCode("")
                setAnswerCode("")
                setIsConnected(false)
                setIsReady(false)
                setPeerReady(false)
              }}
            >
              ออกจากห้อง
            </Button>
          </Card>
        )}

        {mode === "host" && !isConnected && (
          <Card className="p-8 space-y-6 border-2">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">สร้างห้องสำเร็จ!</h2>
              <p className="text-sm text-muted-foreground">ส่งรหัสนี้ให้เพื่อน (คัดลอกอัตโนมัติแล้ว)</p>
            </div>

            <div className="space-y-3">
              <div className="p-4 bg-secondary rounded-lg break-all text-sm font-mono">{inviteCode}</div>
              <Button variant="outline" className="w-full bg-transparent" onClick={() => copyToClipboard(inviteCode)}>
                {copied ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    คัดลอกแล้ว!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    คัดลอกรหัส
                  </>
                )}
              </Button>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">วางรหัสตอบกลับจากเพื่อนที่นี่:</label>
              <Input
                placeholder="รหัสตอบกลับ"
                value={answerCode}
                onChange={(e) => setAnswerCode(e.target.value)}
                className="h-12 font-mono text-sm"
              />
              <Button
                className="w-full h-12 font-semibold"
                onClick={handleAcceptAnswer}
                disabled={!answerCode.trim() || isGenerating}
              >
                {isGenerating ? "กำลังเชื่อมต่อ..." : "เชื่อมต่อ"}
              </Button>
            </div>

            <Button
              variant="ghost"
              className="w-full"
              onClick={() => {
                p2pConnection?.disconnect()
                setMode("menu")
                setInviteCode("")
                setAnswerCode("")
              }}
            >
              ยกเลิก
            </Button>
          </Card>
        )}

        {mode === "join" && !isConnected && (
          <Card className="p-8 space-y-6 border-2">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">เกือบเสร็จแล้ว!</h2>
              <p className="text-sm text-muted-foreground">ส่งรหัสนี้กลับไปให้เพื่อน</p>
            </div>

            <div className="space-y-3">
              <div className="p-4 bg-secondary rounded-lg break-all text-sm font-mono">{answerCode}</div>
              <Button variant="outline" className="w-full bg-transparent" onClick={() => copyToClipboard(answerCode)}>
                {copied ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    คัดลอกแล้ว!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    คัดลอกรหัส
                  </>
                )}
              </Button>
            </div>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">รอการเชื่อมต่อ...</p>
              <div className="mt-4 flex justify-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-75" />
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-150" />
              </div>
            </div>

            <Button
              variant="ghost"
              className="w-full"
              onClick={() => {
                p2pConnection?.disconnect()
                setMode("menu")
                setJoinCode("")
                setAnswerCode("")
              }}
            >
              ยกเลิก
            </Button>
          </Card>
        )}

        <p className="text-center text-xs text-muted-foreground">ผู้เล่น: {settings.playerName}</p>
      </div>
    </div>
  )
}

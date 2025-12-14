"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useGameStore } from "@/lib/game-store"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export function SettingsPage() {
  const { settings, updateSettings } = useGameStore()
  const [playerName, setPlayerName] = useState(settings.playerName)
  const [soundEnabled, setSoundEnabled] = useState(settings.soundEnabled)
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    updateSettings({
      playerName: playerName.trim() || "Player",
      soundEnabled,
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/10">
      <div className="w-full max-w-2xl space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-4xl font-bold text-primary">Settings</h1>
            <p className="text-muted-foreground">Customize your gaming experience</p>
          </div>
        </div>

        <Card className="p-8 space-y-8 border-2">
          {/* Player Settings */}
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold mb-1">Player Profile</h2>
              <p className="text-sm text-muted-foreground">Your identity in the game</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="playerName" className="text-base">
                Player Name
              </Label>
              <Input
                id="playerName"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                className="h-12 text-base"
                maxLength={20}
              />
              <p className="text-xs text-muted-foreground">This name will be displayed to other players</p>
            </div>
          </div>

          <div className="border-t border-border pt-8">
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold mb-1">Audio</h2>
                <p className="text-sm text-muted-foreground">Sound and music preferences</p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="sound" className="text-base">
                    Sound Effects
                  </Label>
                  <p className="text-sm text-muted-foreground">Enable game sound effects</p>
                </div>
                <Switch id="sound" checked={soundEnabled} onCheckedChange={setSoundEnabled} />
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-8">
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold mb-1">About</h2>
                <p className="text-sm text-muted-foreground">Information about this platform</p>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Platform</span>
                  <span className="font-medium">Co-op Arcade</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Version</span>
                  <span className="font-medium">1.0.0</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Connection Type</span>
                  <span className="font-medium">P2P WebRTC</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Available Games</span>
                  <span className="font-medium">3 Games</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <Button className="w-full h-12 text-base font-semibold" onClick={handleSave}>
              {saved ? "Settings Saved!" : "Save Settings"}
            </Button>
          </div>
        </Card>

        <div className="text-center">
          <Link href="/">
            <Button variant="ghost" className="text-muted-foreground">
              Back to Main Menu
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

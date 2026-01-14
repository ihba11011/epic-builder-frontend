"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Building2, ArrowRight, Users, FolderKanban } from "lucide-react"
import { workspaceService } from "@/lib/services"
import { useWorkspaceStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

const steps = [
  { id: 1, title: "Organization", description: "Set up your workspace" },
  { id: 2, title: "Team", description: "Invite your team" },
  { id: 3, title: "Project", description: "Create your first project" },
]

export default function OrgSetupPage() {
  const router = useRouter()
  const { addWorkspace, setCurrentWorkspace } = useWorkspaceStore()
  const [step, setStep] = useState(1)
  const [orgName, setOrgName] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleComplete = async () => {
    setIsLoading(true)

    try {
      const workspace = await workspaceService.create({
        name: orgName,
        slug: orgName.toLowerCase().replace(/\s+/g, "-"),
      })
      addWorkspace(workspace)
      setCurrentWorkspace(workspace)
      toast.success("Workspace created!", { description: "Let's get started" })
      router.push("/app/dashboard")
    } catch {
      toast.error("Failed to create workspace")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-lg relative z-10"
      >
        <Card className="border-border/50 bg-card/80 backdrop-blur-xl shadow-2xl">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center gap-2">
              {steps.map((s) => (
                <div
                  key={s.id}
                  className={`flex h-2 w-16 rounded-full transition-colors ${s.id <= step ? "bg-primary" : "bg-muted"}`}
                />
              ))}
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">Set up your organization</CardTitle>
              <CardDescription>Let&apos;s get your workspace ready</CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {step === 1 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                <div className="flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                    <Building2 className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="orgName">Organization Name</Label>
                  <Input
                    id="orgName"
                    placeholder="Acme Corporation"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                  />
                </div>
                <Button className="w-full" onClick={() => setStep(2)} disabled={!orgName}>
                  Continue <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                <div className="flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <div className="text-center">
                  <h3 className="font-medium">Invite team members</h3>
                  <p className="text-sm text-muted-foreground mt-1">You can invite team members later</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 bg-transparent" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button className="flex-1" onClick={() => setStep(3)}>
                    Skip for now
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                <div className="flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                    <FolderKanban className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <div className="text-center">
                  <h3 className="font-medium">Ready to go!</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your workspace <span className="font-medium text-foreground">{orgName}</span> is ready
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 bg-transparent" onClick={() => setStep(2)}>
                    Back
                  </Button>
                  <Button className="flex-1" onClick={handleComplete} disabled={isLoading}>
                    {isLoading ? "Creating..." : "Get Started"}
                  </Button>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

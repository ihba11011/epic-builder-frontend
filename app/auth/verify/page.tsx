"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"
import { authService } from "@/lib/services"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")

  useEffect(() => {
    const verify = async () => {
      try {
        await authService.verifyEmail("mock-token")
        setStatus("success")
      } catch {
        setStatus("error")
      }
    }
    verify()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="border-border/50 bg-card/80 backdrop-blur-xl shadow-2xl">
          <CardHeader className="text-center space-y-4">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg"
            >
              {status === "loading" && <Loader2 className="h-7 w-7 text-primary-foreground animate-spin" />}
              {status === "success" && <CheckCircle className="h-7 w-7 text-primary-foreground" />}
              {status === "error" && <XCircle className="h-7 w-7 text-primary-foreground" />}
            </motion.div>
            <div>
              <CardTitle className="text-2xl font-bold">
                {status === "loading" && "Verifying email..."}
                {status === "success" && "Email verified!"}
                {status === "error" && "Verification failed"}
              </CardTitle>
              <CardDescription>
                {status === "loading" && "Please wait while we verify your email address"}
                {status === "success" && "Your email has been successfully verified"}
                {status === "error" && "The verification link may have expired"}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="flex justify-center">
            {status !== "loading" && (
              <Button asChild>
                <Link href="/auth/login">{status === "success" ? "Continue to login" : "Back to login"}</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

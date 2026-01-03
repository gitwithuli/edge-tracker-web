"use client"

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    // Try to sign in
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    
    if (error) {
      // If sign in fails, try to sign up automatically
      const { error: signUpError } = await supabase.auth.signUp({ email, password })
      if (signUpError) {
        alert(error.message)
      } else {
        alert('Account created! Please check your email to verify.')
      }
    } else {
      router.push('/')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <Card className="w-full max-w-md bg-zinc-900 border-zinc-800 text-zinc-100">
        <CardHeader>
          <CardTitle className="text-center">Edge Tracker Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <Input 
              type="email" 
              placeholder="Email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              className="bg-zinc-950 border-zinc-800"
              required
            />
            <Input 
              type="password" 
              placeholder="Password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              className="bg-zinc-950 border-zinc-800"
              required
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Loading...' : 'Sign In / Sign Up'}
            </Button>
            <p className="text-xs text-center text-zinc-500">
              New here? Entering details will auto-create an account.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
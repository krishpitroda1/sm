'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getMemberByLogin } from '@/actions/member'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import Image from 'next/image'

export default function Home() {
  const [flatNumber, setFlatNumber] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (flatNumber === 'admin' && phone === 'admin') {
        router.push('/admin')
        return
      }

      const res = await getMemberByLogin(flatNumber, phone)
      if (res.success && res.data) {
        localStorage.setItem('user', JSON.stringify(res.data))
        router.push('/dashboard')
      } else {
        setError(res.error || 'Login failed')
      }
    } catch (err) {
      setError('An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      {/* Dynamic Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-primary/20 blur-[150px] mix-blend-multiply opacity-50 dark:opacity-20 rounded-full" />
        <div className="absolute top-1/2 right-1/4 w-3/4 h-3/4 bg-blue-400/10 blur-[150px] mix-blend-multiply opacity-50 dark:opacity-20 rounded-full" />
      </div>

      <div className="w-full max-w-lg space-y-6">
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="relative shadow-2xl rounded-full overflow-hidden border-2 border-primary/20 bg-white dark:bg-card w-24 h-24 flex items-center justify-center">
            {/* Fallback to an icon if logo still fails so it doesn't look broken */}
            <img src="/logo.png" alt="Society Logo" className="w-20 h-20 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />
            <svg className="w-12 h-12 text-primary hidden" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground/90 text-center">Society Maintenance</h1>
          <p className="text-sm text-muted-foreground uppercase tracking-widest font-semibold">Management Portal</p>
        </div>

        <Card className="w-full border border-primary/10 bg-card/60 backdrop-blur-xl shadow-2xl transition-all duration-300">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl text-center font-bold tracking-tight">Welcome Back</CardTitle>
            <CardDescription className="text-center text-muted-foreground">
              Enter your details to access your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="flat" className="text-sm font-medium">Flat Number</Label>
                <Input
                  id="flat"
                  placeholder="e.g. 101"
                  className="bg-background/50 border-primary/20 focus-visible:ring-primary h-11 transition-all"
                  value={flatNumber}
                  onChange={(e) => setFlatNumber(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
                <Input
                  id="phone"
                  placeholder="e.g. 9876543210"
                  className="bg-background/50 border-primary/20 focus-visible:ring-primary h-11 transition-all"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>

              {error && (
                <div className="p-3 text-sm text-destructive-foreground bg-destructive/10 border border-destructive/20 rounded-md animate-in fade-in slide-in-from-top-2">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-11 text-md font-semibold transition-all shadow-lg hover:shadow-primary/25"
                disabled={loading}
              >
                {loading ? 'Authenticating...' : 'Sign In securely'}
              </Button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-xs text-muted-foreground">
                Log in as <span className="font-semibold text-foreground cursor-pointer">Administrator</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

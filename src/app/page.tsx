'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getMemberByLogin } from '@/actions/member'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'

export default function Home() {
  const [flatNumber, setFlatNumber] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (flatNumber === 'admin' && phone === 'admin') {
      router.push('/admin')
      return
    }

    const res = await getMemberByLogin(flatNumber, phone)
    if (res.success && res.data) {
      // Store user in session/localstorage or just query param for MVP
      // Using cookie or localStorage is better.
      localStorage.setItem('user', JSON.stringify(res.data))
      router.push('/dashboard')
    } else {
      setError(res.error || 'Login failed')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Society Maintenance</CardTitle>
          <CardDescription className="text-center">Enter your details to pay maintenance</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="flat">Flat Number</Label>
              <Input
                id="flat"
                placeholder="e.g. 101"
                value={flatNumber}
                onChange={(e) => setFlatNumber(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                placeholder="e.g. 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button type="submit" className="w-full">
              Login
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-gray-500">
            Admin Login? Use (admin/admin)
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

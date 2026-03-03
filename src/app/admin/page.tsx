'use client'

import { useEffect, useState } from 'react'
import { getMembers, createMember } from '@/actions/member'
import { getMaintenanceRuns, createMaintenanceRun } from '@/actions/maintenance'
import { getAllPayments, submitPayment } from '@/actions/payment'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

export default function AdminDashboard() {
    const [members, setMembers] = useState<any[]>([])
    const [runs, setRuns] = useState<any[]>([])
    const [payments, setPayments] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Form states
    const [newMember, setNewMember] = useState({ name: '', flatNumber: '', phone: '' })
    const [newRun, setNewRun] = useState({ title: '', amount: '', month: new Date().getMonth() + 1, year: new Date().getFullYear() })

    const fetchData = async () => {
        setLoading(true)
        const [mRes, rRes, pRes] = await Promise.all([
            getMembers(),
            getMaintenanceRuns(),
            getAllPayments()
        ])
        if (mRes.success) setMembers(mRes.data || [])
        if (rRes.success) setRuns(rRes.data || [])
        if (pRes.success) setPayments(pRes.data || [])
        setLoading(false)
    }

    useEffect(() => {
        fetchData()
    }, [])

    const handleCreateMember = async () => {
        await createMember(newMember)
        setNewMember({ name: '', flatNumber: '', phone: '' })
        fetchData()
    }

    const handleCreateRun = async () => {
        await createMaintenanceRun({
            ...newRun,
            amount: Number(newRun.amount),
            month: Number(newRun.month),
            year: Number(newRun.year)
        })
        setNewRun({ title: '', amount: '', month: new Date().getMonth() + 1, year: new Date().getFullYear() })
        fetchData()
    }

    return (
        <div className="p-8 space-y-8">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                <Button variant="outline" onClick={() => window.location.href = '/'}>
                    <svg className="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                    Back to Login
                </Button>
            </div>

            {/* Members Section */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Members</CardTitle>
                    <Dialog>
                        <DialogTrigger asChild><Button>Add Member</Button></DialogTrigger>
                        <DialogContent>
                            <DialogHeader><DialogTitle>Add New Member</DialogTitle></DialogHeader>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Name</Label>
                                    <Input value={newMember.name} onChange={e => setNewMember({ ...newMember, name: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Flat Number</Label>
                                    <Input value={newMember.flatNumber} onChange={e => setNewMember({ ...newMember, flatNumber: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Phone</Label>
                                    <Input value={newMember.phone} onChange={e => setNewMember({ ...newMember, phone: e.target.value })} />
                                </div>
                                <Button onClick={handleCreateMember}>Create</Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader><TableRow><TableHead>Flat</TableHead><TableHead>Name</TableHead><TableHead>Phone</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {members.map(m => (
                                <TableRow key={m.id}>
                                    <TableCell>{m.flatNumber}</TableCell>
                                    <TableCell>{m.name}</TableCell>
                                    <TableCell>{m.phone}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Maintenance Runs Section */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Maintenance Periods</CardTitle>
                    <Dialog>
                        <DialogTrigger asChild><Button>Create Run</Button></DialogTrigger>
                        <DialogContent>
                            <DialogHeader><DialogTitle>New Maintenance Request</DialogTitle></DialogHeader>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Title</Label>
                                    <Input value={newRun.title} onChange={e => setNewRun({ ...newRun, title: e.target.value })} placeholder="Maintenance Jan 2025" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Amount</Label>
                                    <Input type="number" value={newRun.amount} onChange={e => setNewRun({ ...newRun, amount: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Month</Label>
                                        <Input type="number" value={newRun.month} onChange={e => setNewRun({ ...newRun, month: Number(e.target.value) })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Year</Label>
                                        <Input type="number" value={newRun.year} onChange={e => setNewRun({ ...newRun, year: Number(e.target.value) })} />
                                    </div>
                                </div>
                                <Button onClick={handleCreateRun}>Create</Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Amount</TableHead><TableHead>Month/Year</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {runs.map(r => (
                                <TableRow key={r.id}>
                                    <TableCell>{r.title}</TableCell>
                                    <TableCell>₹{r.amount}</TableCell>
                                    <TableCell>{r.month}/{r.year}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Payments Section */}
            <Card>
                <CardHeader><CardTitle>Payments</CardTitle></CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader><TableRow><TableHead>Member</TableHead><TableHead>Run</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead>Txn ID</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {payments.map(p => (
                                <TableRow key={p.id}>
                                    <TableCell>{p.user ? `${p.user.name} (${p.user.flatNumber})` : 'Unknown User'}</TableCell>
                                    <TableCell>{p.run?.title || 'Unknown Run'}</TableCell>
                                    <TableCell>₹{p.amount}</TableCell>
                                    <TableCell><Badge variant={p.status === 'COMPLETED' ? 'default' : 'secondary'}>{p.status}</Badge></TableCell>
                                    <TableCell>{p.transactionId}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}

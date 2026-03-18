'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getActiveRunsForMember, getMemberPayments } from '@/actions/payment'
import { Home, Phone, Mail, User as UserIcon, LogOut, CheckCircle2, CreditCard, ArrowRight, Receipt, Printer, Building2, CheckCircle, Clock } from 'lucide-react'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

declare global {
    interface Window {
        Razorpay: any
    }
}

function loadRazorpayScript(): Promise<boolean> {
    return new Promise((resolve) => {
        if (document.getElementById('razorpay-script')) {
            resolve(true)
            return
        }
        const script = document.createElement('script')
        script.id = 'razorpay-script'
        script.src = 'https://checkout.razorpay.com/v1/checkout.js'
        script.onload = () => resolve(true)
        script.onerror = () => resolve(false)
        document.body.appendChild(script)
    })
}

export default function Dashboard() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)

    // Data
    const [activeRuns, setActiveRuns] = useState<any[]>([])
    const [payments, setPayments] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [payingRunId, setPayingRunId] = useState<string | null>(null)

    // Receipt modal
    const [receiptModal, setReceiptModal] = useState(false)
    const [receiptPayment, setReceiptPayment] = useState<any>(null)
    const receiptRef = useRef<HTMLDivElement>(null)

    const societyName = process.env.NEXT_PUBLIC_SOCIETY_NAME || 'Society Maintenance System'
    const razorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || ''

    useEffect(() => {
        const storedUser = localStorage.getItem('user')
        if (!storedUser) { router.push('/'); return }
        const u = JSON.parse(storedUser)
        setUser(u)
        fetchData(u.id)
    }, [router])

    const fetchData = async (userId: string) => {
        setLoading(true)
        const [runsRes, paymentsRes] = await Promise.all([
            getActiveRunsForMember(userId),
            getMemberPayments(userId),
        ])
        if (runsRes.success && runsRes.data) setActiveRuns(runsRes.data as any[])
        if (paymentsRes.success && paymentsRes.data) setPayments(paymentsRes.data as any[])
        setLoading(false)
    }

    const handlePayNow = async (run: any) => {
        setPayingRunId(run.id)
        try {
            const loaded = await loadRazorpayScript()
            if (!loaded) {
                alert('Failed to load payment gateway. Please check your internet connection.')
                setPayingRunId(null)
                return
            }

            // Step 1: Create Razorpay order on backend
            const orderRes = await fetch('/api/payment/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, runId: run.id }),
            })
            const orderData = await orderRes.json()
            if (!orderRes.ok || !orderData.orderId) {
                alert(orderData.error || 'Failed to initiate payment')
                setPayingRunId(null)
                return
            }

            // Step 2: Open Razorpay Checkout
            const options = {
                key: razorpayKeyId,
                amount: orderData.amount,
                currency: orderData.currency,
                name: societyName,
                description: `${orderData.runTitle} - Flat ${user.flatNumber}`,
                order_id: orderData.orderId,
                prefill: {
                    name: user.name,
                    email: user.email || '',
                    contact: user.phone,
                },
                theme: { color: '#0F172A' },
                handler: async (response: any) => {
                    // Step 3: Verify payment on backend
                    const verifyRes = await fetch('/api/payment/verify', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            paymentId: orderData.paymentId,
                        }),
                    })
                    const verifyData = await verifyRes.json()
                    if (verifyData.success) {
                        await fetchData(user.id)
                        // Show receipt for just-completed payment
                        setReceiptPayment(verifyData.payment)
                        setReceiptModal(true)
                    } else {
                        alert('Payment verification failed. Please contact support.')
                    }
                    setPayingRunId(null)
                },
                modal: {
                    ondismiss: () => setPayingRunId(null),
                },
            }

            const rzp = new window.Razorpay(options)
            rzp.open()
        } catch (err) {
            console.error(err)
            alert('Something went wrong. Please try again.')
            setPayingRunId(null)
        }
    }

    const handleViewReceipt = (payment: any) => {
        setReceiptPayment(payment)
        setReceiptModal(true)
    }

    const handlePrintReceipt = () => {
        const printContent = receiptRef.current?.innerHTML
        if (!printContent) return
        const win = window.open('', '_blank')
        if (!win) return
        win.document.write(`
            <html><head><title>Receipt - ${receiptPayment?.run?.title}</title>
            <style>
                body { font-family: 'Inter', Arial, sans-serif; padding: 40px; color: #1e293b; max-width: 500px; margin: 0 auto; line-height: 1.5; }
                .card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 32px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
                h1 { color: #0f172a; font-size: 24px; margin-bottom: 8px; text-align: center; letter-spacing: -0.025em; }
                .sub { color: #64748b; font-size: 14px; margin-bottom: 24px; text-align: center; }
                hr { border: none; border-top: 1px dashed #cbd5e1; margin: 20px 0; }
                .row { display: flex; justify-content: space-between; margin: 12px 0; font-size: 15px; }
                .label { color: #64748b; }
                .value { font-weight: 600; color: #0f172a; }
                .amount-container { background: #f8fafc; padding: 16px; border-radius: 8px; margin: 24px 0; text-align: center; }
                .stamp { display: inline-block; border: 3px solid #16a34a; color: #16a34a; padding: 8px 24px; font-size: 24px; font-weight: 800; border-radius: 8px; transform: rotate(-5deg); margin: 24px auto; display: flex; justify-content: center; width: fit-content; letter-spacing: 0.1em; }
                .footer { text-align: center; font-size: 12px; color: #94a3b8; margin-top: 32px; }
            </style>
            </head><body onclick="window.print()">
            <div class="card">${printContent}</div>
            </body></html>
        `)
        win.document.close()
        // Allow time for rendering before print dialog
        setTimeout(() => win.print(), 250)
    }

    const handleCloseReceipt = () => {
        setReceiptModal(false)
    }

    const handleLogout = () => {
        localStorage.removeItem('user')
        router.push('/')
    }

    if (!user) return null

    return (
        <div className="min-h-screen bg-[conic-gradient(at_top_right,_var(--tw-gradient-stops))] from-slate-100 via-sky-50 to-slate-100 p-4 md:p-8 font-sans selection:bg-blue-200">
            <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white/70 backdrop-blur-xl p-6 rounded-3xl shadow-sm border border-white/50 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/3" />
                    <div className="relative z-10 flex items-center gap-4">
                        <div className="p-4 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-xl shadow-slate-900/20 text-white">
                            <Building2 size={32} strokeWidth={1.5} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{societyName}</h1>
                            <p className="text-slate-500 font-medium tracking-wide mt-1">MEMBER PORTAL</p>
                        </div>
                    </div>
                    <Button onClick={handleLogout} variant="ghost" className="relative z-10 text-slate-600 hover:bg-slate-200/50 hover:text-slate-900 rounded-xl px-4 py-6 font-medium">
                        <LogOut className="w-5 h-5 mr-2" /> Logout
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column - Member Info & Actions */}
                    <div className="lg:col-span-4 space-y-8">
                        {/* Member Identity Card */}
                        <div className="bg-gradient-to-b from-slate-900 to-slate-800 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl shadow-slate-800/30">
                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                <UserIcon size={120} />
                            </div>
                            <div className="relative z-10">
                                <p className="text-slate-400 font-medium tracking-widest text-sm mb-1 uppercase">Welcome Back</p>
                                <h2 className="text-3xl font-bold mb-8">{user.name}</h2>

                                <div className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md">
                                            <Home size={18} className="text-blue-300" />
                                        </div>
                                        <div>
                                            <p className="text-slate-400 text-xs tracking-wider uppercase">Flat Number</p>
                                            <p className="font-semibold text-lg">{user.flatNumber}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md">
                                            <Phone size={18} className="text-blue-300" />
                                        </div>
                                        <div>
                                            <p className="text-slate-400 text-xs tracking-wider uppercase">Phone</p>
                                            <p className="font-semibold text-lg">{user.phone}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md">
                                            <Mail size={18} className="text-blue-300" />
                                        </div>
                                        <div>
                                            <p className="text-slate-400 text-xs tracking-wider uppercase">Email</p>
                                            <p className="font-semibold text-lg truncate w-48">{user.email || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Dues & History */}
                    <div className="lg:col-span-8 space-y-8">
                        {/* Active Dues */}
                        <Card className="border-0 shadow-xl shadow-slate-200/50 bg-white/80 backdrop-blur-xl overflow-hidden rounded-3xl">
                            <div className="p-8">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                                        <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                                            <CreditCard size={20} />
                                        </div>
                                        Pending Dues
                                    </h2>
                                </div>

                                {loading ? (
                                    <div className="h-40 flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
                                    </div>
                                ) : activeRuns.length === 0 ? (
                                    <div className="text-center py-12 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-100/50 relative overflow-hidden">
                                        <div className="absolute -right-8 -bottom-8 text-green-200/40">
                                            <CheckCircle size={150} />
                                        </div>
                                        <div className="relative z-10">
                                            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 text-green-500 shadow-xl shadow-green-200/50">
                                                <CheckCircle2 size={40} />
                                            </div>
                                            <p className="text-slate-900 font-extrabold text-2xl mb-2">You're all caught up!</p>
                                            <p className="text-slate-500 font-medium">No pending maintenance payments for your flat.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid gap-4 md:grid-cols-2">
                                        {activeRuns.map(run => (
                                            <div key={run.id} className="group flex flex-col justify-between bg-white border border-slate-200 hover:border-blue-300 p-6 rounded-2xl shadow-sm hover:shadow-xl hover:shadow-blue-100/50 transition-all duration-300 ease-out">
                                                <div>
                                                    <div className="flex justify-between items-start mb-4">
                                                        <Badge variant="secondary" className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold px-3 py-1 rounded-md">
                                                            {MONTHS[run.month - 1]} {run.year}
                                                        </Badge>
                                                        <Clock size={18} className="text-orange-400" />
                                                    </div>
                                                    <h3 className="font-bold text-slate-900 text-xl mb-1">{run.title}</h3>
                                                    <p className="text-sm text-slate-500 font-medium mb-6">Standard society dues</p>
                                                </div>

                                                <div className="pt-4 border-t border-slate-100 flex items-end justify-between">
                                                    <div>
                                                        <span className="text-sm text-slate-500 font-medium">Amount</span>
                                                        <div className="flex items-baseline gap-1">
                                                            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">₹{run.amount}</span>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        onClick={() => handlePayNow(run)}
                                                        disabled={payingRunId === run.id}
                                                        className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-6 py-6 shadow-lg shadow-slate-900/20 group-hover:scale-105 transition-all"
                                                    >
                                                        {payingRunId === run.id ? 'Connecting...' : (
                                                            <>Pay Now <ArrowRight className="w-4 h-4 ml-2" /></>
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </Card>

                        {/* Payment History */}
                        <Card className="border-0 shadow-xl shadow-slate-200/50 bg-white/80 backdrop-blur-xl rounded-3xl overflow-hidden">
                            <div className="p-8">
                                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2 mb-6">
                                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                        <Receipt size={20} />
                                    </div>
                                    Payment History
                                </h2>

                                {payments.length === 0 ? (
                                    <div className="text-center py-12 text-slate-400 font-medium">No previous payments found.</div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="border-slate-100 hover:bg-transparent">
                                                    <TableHead className="font-semibold text-slate-500">Period</TableHead>
                                                    <TableHead className="font-semibold text-slate-500">Amount</TableHead>
                                                    <TableHead className="font-semibold text-slate-500">Date</TableHead>
                                                    <TableHead className="font-semibold text-slate-500">Status</TableHead>
                                                    <TableHead className="text-right font-semibold text-slate-500">Action</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {payments.map(p => (
                                                    <TableRow key={p.id} className="border-slate-100 hover:bg-slate-50 transition-colors">
                                                        <TableCell className="py-4">
                                                            <span className="font-bold text-slate-900">{p.run.title}</span>
                                                            <br />
                                                            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{MONTHS[p.run.month - 1]} {p.run.year}</span>
                                                        </TableCell>
                                                        <TableCell className="font-extrabold text-slate-900">₹{p.amount}</TableCell>
                                                        <TableCell className="text-sm font-medium text-slate-600">
                                                            {p.paymentDate ? new Date(p.paymentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant={p.status === 'COMPLETED' ? 'default' : 'secondary'} className={p.status === 'COMPLETED' ? 'bg-green-100 text-green-700 hover:bg-green-200 border-0' : ''}>
                                                                {p.status}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            {p.status === 'COMPLETED' && (
                                                                <Button size="sm" variant="outline" onClick={() => handleViewReceipt(p)} className="rounded-lg text-slate-600 border-slate-200 hover:bg-slate-100">
                                                                    <Receipt size={16} className="mr-2" /> View
                                                                </Button>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Receipt Modal */}
            <Dialog open={receiptModal} onOpenChange={(open) => {
                if (!open) handleCloseReceipt()
            }}>
                <DialogContent className="max-w-md p-0 overflow-y-auto overflow-x-hidden max-h-[90dvh] bg-slate-50 rounded-3xl border-0 shadow-2xl">
                    <DialogHeader className="p-4 md:p-6 bg-white border-b border-slate-100 pb-3 md:pb-4">
                        <DialogTitle className="text-center font-bold text-xl text-slate-900">Payment Active Receipt</DialogTitle>
                    </DialogHeader>

                    {receiptPayment && (
                        <div className="p-4 md:p-6">
                            <div ref={receiptRef} className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 space-y-4 md:space-y-6 relative overflow-hidden shadow-sm">
                                {/* Watermark */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none">
                                    <Building2 size={300} />
                                </div>

                                <div className="text-center relative z-10">
                                    <div className="mx-auto w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center mb-4">
                                        <Building2 size={24} />
                                    </div>
                                    <h1 className="text-2xl font-black tracking-tight text-slate-900">{societyName}</h1>
                                    <p className="text-slate-500 text-xs font-semibold tracking-widest uppercase mt-2">Official Receipt</p>
                                </div>

                                <div className="border-t border-dashed border-slate-200 my-4 md:my-6 relative z-10"></div>

                                <div className="space-y-4 text-sm relative z-10">
                                    <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                                        <span className="text-slate-500 font-medium">Receipt No.</span>
                                        <span className="font-mono font-bold text-slate-900">{receiptPayment.id?.toUpperCase?.().slice(-8) || receiptPayment.transactionId?.slice(-8)}</span>
                                    </div>

                                    <div className="px-2 space-y-3">
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Member</span>
                                            <span className="font-bold text-slate-900">{receiptPayment.user?.name || user.name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Flat Number</span>
                                            <span className="font-bold text-slate-900">{receiptPayment.user?.flatNumber || user.flatNumber}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Description</span>
                                            <span className="font-bold text-slate-900">{receiptPayment.run?.title}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Period</span>
                                            <span className="font-bold text-slate-900">
                                                {MONTHS[(receiptPayment.run?.month || 1) - 1]} {receiptPayment.run?.year}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Date Paid</span>
                                            <span className="font-bold text-slate-900">
                                                {receiptPayment.paymentDate
                                                    ? new Date(receiptPayment.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                                                    : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center pt-2">
                                            <span className="text-slate-500">Transaction ID</span>
                                            <span className="font-mono text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded">{receiptPayment.transactionId}</span>
                                        </div>
                                    </div>

                                    <div className="mt-4 md:mt-6 bg-slate-900 text-white rounded-xl p-3 md:p-4 flex justify-between items-center shadow-lg shadow-slate-900/20">
                                        <span className="text-slate-300 font-medium tracking-wide uppercase text-xs">Total Amount</span>
                                        <span className="font-black text-2xl">₹{receiptPayment.amount}</span>
                                    </div>
                                </div>

                                <div className="flex justify-center mt-4 md:mt-8 relative z-10">
                                    <div className="border-2 border-green-500 text-green-600 rounded-lg px-6 md:px-8 py-1.5 md:py-2 font-black text-lg md:text-xl -rotate-6 inline-block bg-white/70 backdrop-blur tracking-widest shadow-sm">
                                        PAID
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-4 md:mt-6">
                                <Button onClick={handlePrintReceipt} variant="outline" className="flex-1 rounded-xl h-12 border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold">
                                    <Printer size={18} className="mr-2" /> Print
                                </Button>
                                <Button onClick={handleCloseReceipt} className="flex-1 bg-slate-900 hover:bg-slate-800 h-12 rounded-xl text-white shadow-lg shadow-slate-900/20 font-semibold">
                                    Done
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}

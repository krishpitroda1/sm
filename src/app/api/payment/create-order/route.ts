import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { initiatePayment } from '@/actions/payment'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
    try {
        const RazorpayModule = await import('razorpay')
        const Razorpay = RazorpayModule.default
        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID || '',
            key_secret: process.env.RAZORPAY_KEY_SECRET || '',
        })

        const { userId, runId } = await req.json()

        if (!userId || !runId) {
            return NextResponse.json({ error: 'Missing userId or runId' }, { status: 400 })
        }

        // Fetch run details for amount
        const run = await prisma.maintenanceRun.findUnique({ where: { id: runId } })
        if (!run) {
            return NextResponse.json({ error: 'Maintenance run not found' }, { status: 404 })
        }

        // Create/retrieve internal payment record
        const paymentRes = await initiatePayment(userId, runId)
        if (!paymentRes.success) {
            return NextResponse.json({ error: paymentRes.error }, { status: 500 })
        }

        // Create Razorpay order (amount in paise)
        const order = await razorpay.orders.create({
            amount: Math.round(run.amount * 100),
            currency: 'INR',
            receipt: paymentRes.data!.id,
            notes: {
                paymentId: paymentRes.data!.id,
                userId,
                runId,
                flatNumber: '',
                runTitle: run.title,
            },
        })

        return NextResponse.json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            paymentId: paymentRes.data!.id,
            runTitle: run.title,
        })
    } catch (err: any) {
        console.error('[create-order]', err)
        return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
    }
}

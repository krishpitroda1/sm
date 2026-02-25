import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, paymentId } = await req.json()

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !paymentId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Verify Razorpay signature (HMAC SHA256)
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex')

        if (expectedSignature !== razorpay_signature) {
            return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 })
        }

        // Mark payment as COMPLETED in DB
        const payment = await prisma.payment.update({
            where: { id: paymentId },
            data: {
                transactionId: razorpay_payment_id,
                status: 'COMPLETED',
                paymentDate: new Date(),
            },
            include: { user: true, run: true },
        })

        return NextResponse.json({ success: true, payment })
    } catch (err: any) {
        console.error('[verify-payment]', err)
        return NextResponse.json({ error: 'Payment verification failed' }, { status: 500 })
    }
}

'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function initiatePayment(userId: string, runId: string) {
    // Check if payment already exists
    const existing = await prisma.payment.findFirst({
        where: { userId, runId }
    })
    if (existing) return { success: true, data: existing }

    // Fetch run details for amount
    const run = await prisma.maintenanceRun.findUnique({ where: { id: runId } })
    if (!run) return { success: false, error: "Run not found" }

    const payment = await prisma.payment.create({
        data: {
            userId,
            runId,
            amount: run.amount,
            status: 'PENDING'
        }
    })
    return { success: true, data: payment }
}

export async function submitPayment(paymentId: string, transactionId: string) {
    try {
        const payment = await prisma.payment.update({
            where: { id: paymentId },
            data: {
                transactionId,
                status: 'COMPLETED',
                paymentDate: new Date()
            }
        })
        revalidatePath('/dashboard')
        revalidatePath('/admin')
        return { success: true, data: payment }
    } catch (e) {
        return { success: false, error: "Failed to submit payment" }
    }
}

export async function getMemberPayments(userId: string) {
    try {
        const payments = await prisma.payment.findMany({
            where: { userId },
            include: { run: true },
            orderBy: { createdAt: 'desc' }
        })
        return { success: true, data: payments }
    } catch (e) {
        return { success: false, error: "Failed to fetch payments" }
    }
}

export async function getAllPayments() {
    try {
        const payments = await prisma.payment.findMany({
            include: {
                user: true,
                run: true
            },
            orderBy: { createdAt: 'desc' }
        })
        return { success: true, data: payments }
    } catch (e) {
        return { success: false, error: "Failed to fetch payments" }
    }
}

export async function getActiveRunsForMember(userId: string) {
    try {
        // Get all maintenance runs
        const allRuns = await prisma.maintenanceRun.findMany({
            orderBy: { createdAt: 'desc' }
        })
        // Get completed payments for this user
        const completedPayments = await prisma.payment.findMany({
            where: { userId, status: 'COMPLETED' },
            select: { runId: true }
        })
        const completedRunIds = new Set(completedPayments.map(p => p.runId))

        // Return runs that haven't been completed paid yet
        const activeRuns = allRuns.filter(r => !completedRunIds.has(r.id))
        return { success: true, data: activeRuns }
    } catch (e) {
        return { success: false, error: "Failed to fetch active runs" }
    }
}

export async function getPaymentById(paymentId: string) {
    try {
        const payment = await prisma.payment.findUnique({
            where: { id: paymentId },
            include: { user: true, run: true }
        })
        if (!payment) return { success: false, error: "Payment not found" }
        return { success: true, data: payment }
    } catch (e) {
        return { success: false, error: "Failed to fetch payment" }
    }
}

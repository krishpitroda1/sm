'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function createMaintenanceRun(data: {
    title: string
    amount: number
    month: number
    year: number
}) {
    try {
        const run = await prisma.maintenanceRun.create({ data })
        revalidatePath('/admin')
        return { success: true, data: run }
    } catch (error) {
        console.error(error)
        return { success: false, error: 'Failed to create maintenance run' }
    }
}

export async function getMaintenanceRuns() {
    try {
        const runs = await prisma.maintenanceRun.findMany({
            orderBy: { createdAt: 'desc' },
        })
        return { success: true, data: runs }
    } catch (error) {
        return { success: false, error: 'Failed to fetch maintenance runs' }
    }
}

export async function getMaintenanceRunById(id: string) {
    try {
        const run = await prisma.maintenanceRun.findUnique({
            where: { id },
        })
        return { success: true, data: run }
    } catch (error) {
        return { success: false, error: 'Run not found' }
    }
}

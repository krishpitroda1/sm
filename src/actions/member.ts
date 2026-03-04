'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getMembers() {
    try {
        const members = await prisma.user.findMany({
            where: { role: 'MEMBER' },
            orderBy: { flatNumber: 'asc' },
        })
        return { success: true, data: members }
    } catch (error) {
        return { success: false, error: 'Failed to fetch members' }
    }
}

export async function getMemberByLogin(flatNumber: string, phone: string) {
    try {
        const member = await prisma.user.findFirst({
            where: {
                flatNumber,
                phone,
                role: 'MEMBER',
            },
        })
        if (!member) return { success: false, error: 'Member not found' }
        return { success: true, data: member }
    } catch (error) {
        return { success: false, error: 'Login failed' }
    }
}

export async function createMember(data: { name: string; phone: string; flatNumber: string; email?: string }) {
    try {
        const member = await prisma.user.create({
            data: {
                ...data,
                role: 'MEMBER',
            },
        })
        revalidatePath('/admin')
        return { success: true, data: member }
    } catch (error: any) {
        console.error('[createMember] Error:', JSON.stringify(error, null, 2))
        // Handle unique constraint violations (Prisma error code P2002)
        if (error?.code === 'P2002') {
            const field = error?.meta?.target?.[0] || 'field'
            return { success: false, error: `A member with this ${field} already exists.` }
        }
        return { success: false, error: `Failed to create member: ${error?.message || 'Unknown error'}` }
    }
}

export async function getAdmin() {
    // Basic check if admin exists, if not create one?
    // For now, just return specific admin if needed or use middleware for protection
    // This is simple action to get admin details
    return { success: true }
}

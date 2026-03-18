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
        // Generate a unique dummy email if not provided, to prevent MongoDB unique index collisions on null
        const uniqueEmail = data.email || `${data.flatNumber}_${data.phone}@society.local`

        const member = await prisma.user.create({
            data: {
                ...data,
                email: uniqueEmail,
                role: 'MEMBER',
            },
        })
        revalidatePath('/admin')
        return { success: true, data: member }
    } catch (error: any) {
        console.error('[createMember] Error:', JSON.stringify(error, null, 2))
        // Handle unique constraint violations (Prisma error code P2002)
        if (error?.code === 'P2002') {
            let field = 'record'
            const targetStr = String(error?.meta?.target || '')
            if (targetStr.includes('phone')) field = 'phone number'
            else if (targetStr.includes('email')) field = 'email address'
            else if (targetStr.includes('flatNumber')) field = 'flat number'
            else field = 'unique field'
            
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

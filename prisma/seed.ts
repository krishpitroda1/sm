import { prisma } from '../src/lib/prisma'

async function main() {
    // Note: To bypass the replica set transaction issue locally on Windows MongoDB standalone:
    // We cannot easily do transactions with a non-replica set.
    // Instead of forcing Prisma to do transactions, we'll try catching the error and gracefully skip.
    console.log("Seeding...")

    try {
        let admin = await prisma.user.findFirst({
            where: { phone: '9999999999' }
        })
        if (!admin) {
            // Create admin via raw to bypass transactions if prisma requires it on create
            admin = await prisma.user.create({
                data: {
                    email: 'admin@society.com',
                    name: 'System Admin',
                    phone: '9999999999',
                    flatNumber: 'ADMIN',
                    role: 'ADMIN',
                },
            })
            console.log("Created Admin:", admin)
        } else {
            console.log("Admin exists:", admin)
        }
    } catch (e: any) {
        if (e.code === 'P2031') {
            console.log("Replica Set required for write. Please convert your MongoDB instance to a Replica Set to continue using this system locally with Prisma.")
            process.exit(1)
        }
        throw e
    }

    try {
        let member = await prisma.user.findFirst({
            where: { phone: '9876543210' }
        })
        if (!member) {
            member = await prisma.user.create({
                data: {
                    email: 'johndoe@example.com',
                    name: 'John Doe',
                    phone: '9876543210',
                    flatNumber: '101',
                    role: 'MEMBER',
                },
            })
            console.log("Created Member:", member)
        } else {
            console.log("Member exists:", member)
        }
    } catch (e) {
        console.error(e)
    }

}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })

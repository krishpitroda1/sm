import { prisma } from './src/lib/prisma'

async function main() {
    await prisma.maintenanceRun.create({
        data: {
            title: "March 2026 Maintenance",
            month: 3,
            year: 2026,
            amount: 1500
        }
    })
    console.log("Maintenance run created for MongoDB.")
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

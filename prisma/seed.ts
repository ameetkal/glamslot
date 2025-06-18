import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // Create sample services
  const haircut = await prisma.service.create({
    data: {
      name: 'Haircut',
      defaultDuration: 45,
      requiresConsultation: false,
    },
  })
  const color = await prisma.service.create({
    data: {
      name: 'Color',
      defaultDuration: 90,
      requiresConsultation: true,
    },
  })
  const balayage = await prisma.service.create({
    data: {
      name: 'Balayage',
      defaultDuration: 120,
      requiresConsultation: true,
    },
  })

  // Create sample providers
  const alice = await prisma.provider.create({
    data: {
      name: 'Alice Smith',
      email: 'alice@example.com',
      phone: '555-111-2222',
    },
  })
  const bob = await prisma.provider.create({
    data: {
      name: 'Bob Johnson',
      email: 'bob@example.com',
      phone: '555-333-4444',
    },
  })

  // Create provider-service mappings
  await prisma.providerService.createMany({
    data: [
      {
        providerId: alice.id,
        serviceId: haircut.id,
        duration: 45,
        isSpecialty: true,
        requiresConsultation: false,
      },
      {
        providerId: alice.id,
        serviceId: color.id,
        duration: 100,
        isSpecialty: false,
        requiresConsultation: true,
      },
      {
        providerId: bob.id,
        serviceId: haircut.id,
        duration: 50,
        isSpecialty: false,
        requiresConsultation: false,
      },
      {
        providerId: bob.id,
        serviceId: balayage.id,
        duration: 130,
        isSpecialty: true,
        requiresConsultation: true,
      },
    ],
  })

  console.log('Database seeded!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 
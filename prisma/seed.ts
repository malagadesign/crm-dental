import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed...')

  // Crear usuario admin (solo si no existe)
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@example.com' },
  })

  if (!existingAdmin) {
    const hashedPassword = await hash('password', 10)
    
    const admin = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        name: 'Admin',
        password: hashedPassword,
        role: 'admin',
      },
    })
    console.log('✅ Usuario admin creado:', admin.email)
  } else {
    console.log('ℹ️  Usuario admin ya existe:', existingAdmin.email)
  }

  // Crear consultorio de ejemplo (solo si no existe)
  const existingClinic = await prisma.clinic.findFirst({
    where: { name: 'Consultorio Principal' },
  })

  if (!existingClinic) {
    const clinic = await prisma.clinic.create({
      data: {
        name: 'Consultorio Principal',
        address: 'Av. Principal 123',
        phone: '+54 11 1234-5678',
        email: 'info@consultorio.com',
      },
    })
    console.log('✅ Consultorio creado:', clinic.name)
  } else {
    console.log('ℹ️  Consultorio ya existe')
  }

  // Crear tratamiento de ejemplo (solo si no existe)
  const existingTreatment = await prisma.treatment.findFirst({
    where: { name: 'Consulta General' },
  })

  if (!existingTreatment) {
    const treatment = await prisma.treatment.create({
      data: {
        name: 'Consulta General',
        description: 'Consulta odontológica general',
        price: 5000,
        durationMinutes: 30,
        active: true,
      },
    })
    console.log('✅ Tratamiento creado:', treatment.name)
  } else {
    console.log('ℹ️  Tratamiento ya existe')
  }

  console.log('🎉 Seed completado exitosamente!')
  console.log('\n📝 Credenciales de acceso:')
  console.log('   Email: admin@example.com')
  console.log('   Password: password')
  console.log('\n⚠️  IMPORTANTE: Cambia la contraseña después del primer acceso!')
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

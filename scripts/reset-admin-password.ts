/**
 * Script para restablecer la contraseña de un usuario (ej. administrador).
 * Uso: pnpm run db:reset-password [email] [nueva-contraseña]
 * Ejemplo: pnpm run db:reset-password admin@example.com miNuevaPassword123
 *
 * Si no pasas argumentos, resetea el admin por defecto a "password".
 */
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2] || "admin@example.com";
  const newPassword = process.argv[3] || "password";

  if (newPassword.length < 6) {
    console.error("❌ La contraseña debe tener al menos 6 caracteres.");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    console.error(`❌ No existe ningún usuario con el email: ${email}`);
    process.exit(1);
  }

  const hashedPassword = await hash(newPassword, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword },
  });

  console.log("✅ Contraseña actualizada correctamente.");
  console.log(`   Usuario: ${user.email}`);
  console.log(`   Nueva contraseña: ${newPassword}`);
  console.log("\n⚠️  Ya puedes iniciar sesión con estas credenciales.");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

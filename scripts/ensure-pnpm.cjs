const userAgent = process.env.npm_config_user_agent || '';

if (!/pnpm/.test(userAgent)) {
  console.error('\n⛔  Este proyecto SOLO usa pnpm. Ejecuta: pnpm install\n');
  process.exit(1);
}

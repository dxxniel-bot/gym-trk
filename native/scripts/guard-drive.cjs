// Nunca instalar node_modules en la cara I: (Google Drive) del proyecto — regla del sistema (LLM_START.md):
// lo pesado vive en X:\AI_SYSTEM\projects\gym-trk\repo\native o solo en GitHub Actions.
const cwd = process.cwd();
if (/^[Ii]:[\\/]/.test(cwd) || /My Drive/i.test(cwd)) {
  console.error('✗ npm install bloqueado en ' + cwd);
  console.error('  Usa el clon de X:\\AI_SYSTEM\\projects\\gym-trk\\repo\\native, o deja que GitHub Actions compile.');
  process.exit(1);
}

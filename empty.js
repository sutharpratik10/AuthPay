// Empty module used as a fallback for Node.js built-in modules in browser bundles
// This prevents "Module not found" errors when client-side code inadvertently imports server-only modules
const emptyModule = {};
export default emptyModule;

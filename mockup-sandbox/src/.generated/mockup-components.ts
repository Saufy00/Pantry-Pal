// Placeholder for build time type checking. Overwritten by mockupPreviewPlugin at build start.
type ModuleMap = Record<string, () => Promise<Record<string, unknown>>>;
export const modules: ModuleMap = {};

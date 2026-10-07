const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);
// The pure TypeScript logic of the site (daily plan, numerology, signs, trails…) is shared as-is.
config.watchFolders = [path.resolve(__dirname, "../lib")];
config.resolver.nodeModulesPaths = [path.resolve(__dirname, "node_modules")];
config.resolver.extraNodeModules = { "@/lib": path.resolve(__dirname, "../lib") };
module.exports = config;

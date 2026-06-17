const { getDefaultConfig } = require("expo/metro-config");
const exclusionList = require("metro-config/private/defaults/exclusionList").default;
const path = require("path");
const { withUniwindConfig } = require('uniwind/metro'); 
 
const config = getDefaultConfig(__dirname)

config.resolver.useWatchman = false;

const escapePathForRegex = (filePath) =>
  filePath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

config.resolver.blockList = exclusionList([
  "ios/Pods",
  "ios/build",
  "android/.gradle",
  "android/build",
].map((folder) => new RegExp(`^${escapePathForRegex(path.resolve(__dirname, folder))}/.*`)));
 
module.exports = withUniwindConfig(config, {  
  cssEntryFile: './global.css',
  dtsFile: './src/uniwind-types.d.ts',
  extraThemes: [
    'lavender-light',
    'lavender-dark',
    'mint-light',
    'mint-dark',
    'sky-light',
    'sky-dark',
  ],
});

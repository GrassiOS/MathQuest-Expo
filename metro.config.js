const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

config.resolver.alias = {
  "@": path.resolve(__dirname),
  "@assets": path.resolve(__dirname, "assets"),
};

module.exports = config;

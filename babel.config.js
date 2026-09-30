module.exports = function (api) {
  api.cache(true);
  // babel-preset-expo gère déjà expo-router et reanimated/worklets (SDK 50+).
  return {
    presets: ["babel-preset-expo"],
  };
};

module.exports = function (api) {
  api.cache(true);
  return {
    presets: [["babel-preset-expo", { jsxImportSource: "nativewind" }], "nativewind/babel"],
    // Must stay last in the plugins list — react-native-reanimated's own requirement.
    plugins: ["react-native-reanimated/plugin"],
  };
};

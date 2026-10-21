module.exports = function (api) {
  api.cache(true);
  return {
    presets: [["babel-preset-expo", { jsxImportSource: "nativewind" }], "nativewind/babel"],
    // Must stay last in the plugins list — react-native-reanimated 4.x delegates its Babel
    // transform to react-native-worklets; "react-native-reanimated/plugin" still works (it's a
    // thin re-export) but points here directly in case that re-export goes away in a future major.
    plugins: ["react-native-worklets/plugin"],
  };
};

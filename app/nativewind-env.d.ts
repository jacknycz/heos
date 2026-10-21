/// <reference types="nativewind/types" />

// react-native-css-interop's own types don't declare a wildcard module for .css files, and
// TypeScript 6's stricter side-effect-import check (TS2882) now flags App.tsx's
// `import "./global.css"` without one — previously this resolved silently.
declare module "*.css";

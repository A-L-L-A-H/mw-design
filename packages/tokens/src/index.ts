/**
 * Framework-agnostic entry point for the MoonWitness design tokens.
 *
 * This package owns no token values. The single source of truth is `packages/ui`
 * (`src/styles/tokens.css` and `src/token-exporter.ts`, checked for parity at build time),
 * and everything below re-exports its built `dist/token-exporter.js`. Build `@moonwitness/ui` first.
 */
export {
  BUILTIN_SKINS,
  BUILTIN_SKIN_TOKENS,
  CORE_DESIGN_TOKENS,
  DEFAULT_SKIN_ID,
  exportDesignTokenBundle,
  exportSkinTokensToW3cJson,
  exportSkinsToCssVariables,
  exportTailwindThemeExtend,
  exportTokensToCssVariables,
  exportTokensToW3cJson,
  getCssVariableRef,
  hasExternalCdnFontImport,
  parseTokensFromCss,
  verifyTokenParity,
  type BuiltinSkinId,
  type ColorMode,
  type DesignTokenBundle,
  type DesignTokenEntry,
  type SkinDensity,
  type SkinId,
  type SkinMetadata,
  type SkinModeTokens,
  type SkinSwatchPreview,
  type TokenCategory,
  type TokenParityReport,
  type W3cDesignTokenNode,
} from '../../ui/dist/token-exporter.js';

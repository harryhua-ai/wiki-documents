/**
 * Custom ts-jest transformer that handles .js extensions in ES modules
 * This allows TypeScript files with .js extensions in imports to work with Jest
 */

const { TsJestTransformer } = require('ts-jest');

const tsTransformer = new TsJestTransformer();

module.exports = {
  process: (sourceText, sourcePath, transformOptions) => {
    // Remove .js extensions from import/export statements
    let processedSource = sourceText.replace(
      /(?:import|export)\s+.*?from\s+['"]([^'"]+\.js)['"]/g,
      (match, importPath) => match.replace(`${importPath}`, importPath.replace('.js', ''))
    );

    // Also handle dynamic imports
    processedSource = processedSource.replace(
      /import\(['"]([^'"]+\.js)['"]\)/g,
      (match, importPath) => match.replace(`${importPath}`, importPath.replace('.js', ''))
    );

    // Create custom config with ESM enabled
    const config = transformOptions.config || {};
    config.preset = 'ts-jest/presets/default-esm';
    config.globals = config.globals || {};
    config.globals['ts-jest'] = {
      useESM: true,
      tsconfig: 'tsconfig.test.json',
    };

    return tsTransformer.process(processedSource, sourcePath, { ...transformOptions, config });
  },
};

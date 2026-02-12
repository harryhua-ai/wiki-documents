/**
 * Custom ts-jest transformer that handles .js extensions in ES modules
 * This allows TypeScript files with .js extensions in imports to work with Jest
 */

const tsJest = require('ts-jest').default;

const createTransformer = tsJest.default({
  useESM: true,
  tsconfig: 'tsconfig.test.json',
});

module.exports = {
  ...createTransformer,
  process: (sourceText, sourcePath, ...rest) => {
    // Remove .js extensions from import/export statements
    const processedSource = sourceText.replace(
      /(?:import|export)\s+.*?from\s+['"]([^'"]+\.js)['"]/g,
      (match, importPath) => match.replace(`${importPath}`, importPath.replace('.js', ''))
    );

    // Also handle dynamic imports
    const processedSourceDynamic = processedSource.replace(
      /import\(['"]([^'"]+\.js)['"]\)/g,
      (match, importPath) => match.replace(`${importPath}`, importPath.replace('.js', ''))
    );

    return createTransformer.process.call(
      createTransformer,
      processedSourceDynamic,
      sourcePath,
      ...rest
    );
  },
};

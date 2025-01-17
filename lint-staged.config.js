module.exports = {
    // Type check TypeScript files
    '**/*.(ts|tsx)': () => 'npm run husky-tsc',

    // Lint and format TypeScript, JS and CSS files
    '**/*.(ts|tsx|js|jsx)': (filenames) => [
        `npm run husky-eslint --fix ${filenames.join(' ')}`,
        `npm run husky-prettier --write ${filenames.join(' ')}`
    ],

    // Format MarkDown and JSON
    '**/*.(md|json)': (filenames) => `npm run husky-prettier --write ${filenames.join(' ')}`
}

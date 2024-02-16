import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';

const sharedConfig = {
    input: `src/throttle.ts`,
    watch: {
        include: 'src/**',
    },
    plugins: [
        // Compile TypeScript files
        typescript(),
        // Minify the output
        terser(),
    ],
};
const outputs = [
    {file: 'dist/lib/throttle.js', name: 'throttle', format: 'umd', sourcemap: true},
    {file: 'dist/lib/throttle.mjs', name: 'throttle', format: 'es', sourcemap: true},
];

export default outputs.map((output) => ({...sharedConfig, output}));

import commonjs from 'rollup-plugin-commonjs';
import sourceMaps from 'rollup-plugin-sourcemaps';
import {terser} from 'rollup-plugin-terser';
import typescript from 'rollup-plugin-typescript2';

const pkg = require('./package.json');

const sharedConfig = {
    input: `src/throttle.ts`,
    watch: {
        include: 'src/**'
    },
    plugins: [
        // Compile TypeScript files
        typescript({useTsconfigDeclarationDir: true}),
        // Allow bundling cjs modules (unlike webpack, rollup doesn't understand cjs)
        commonjs(),
        // Resolve source maps to the original source
        sourceMaps(),
        // Minify the output
        terser()
    ]
};

const outputs = [
    {file: pkg.main, name: 'throttle', format: 'umd', sourcemap: true},
    {file: pkg.module, name: 'throttle', format: 'es', sourcemap: true}
];

export default outputs.map(output => ({...sharedConfig, output}));

import * as esbuild from 'esbuild'

const __dirname = process.cwd();
const buildDir = `${__dirname}/build`;

await esbuild.build({
    entryPoints: ['index.js'],
    absWorkingDir: `${__dirname}`,
    outfile:  `${buildDir}/server.js`,
    platform: 'node',
    bundle: true,
    minify: true,
    sourcemap: false,
    target: ['node22', 'es2022']
});

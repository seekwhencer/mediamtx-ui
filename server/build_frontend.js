import * as esbuild from 'esbuild'

const __dirname = process.cwd();
const buildDir = `${__dirname}/build`;

await esbuild.build({
    entryPoints: ['index.js'],
    absWorkingDir: `${__dirname}/public/js`,
    outfile:  `${buildDir}/js/page.js`,
    bundle: true,
    minify: true,
    sourcemap: false,
    target: ['es2022']
});

await esbuild.build({
    entryPoints: ['page.css'],
    absWorkingDir: `${__dirname}/public/css`,
    outfile: `${buildDir}/css/page.css`,
    bundle: true,
    minify: true,
    sourcemap: false,
    target: ['es2022'],
    loader: {
        '.woff2': 'dataurl',
        '.woff': 'dataurl',
    },
});
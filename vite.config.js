const path = require('path');

const config = {
    root: './',
    base: '/systems/thewalkingdead/',
    publicDir: path.resolve(__dirname, 'system'),
    server: {
        port: 8080,
        open: true,
        proxy: {
            '/systems/thewalkingdead/templates/*.hbs': 'http://localhost:30000/',
            '^(?!/systems/thewalkingdead)': 'http://localhost:30000/',
            '/socket.io': {
                target: 'ws://localhost:30000',
                ws: true,
            },
        },
    },
    build: {
        assetsInlineLimit: 0,
        outDir: path.resolve(__dirname, 'dist'),
        emptyOutDir: true,
        sourcemap: true,
        brotliSize: true,
        lib: {
            name: 'thewalkingdead',
            entry: path.resolve(__dirname, 'src/index.js'),
            formats: ['es'],
            fileName: () => 'thewalkingdead.js',
        },
        rollupOptions: {
            output: {
                assetFileNames(chunkInfo) {
                    if (chunkInfo.name === 'style.css') return 'thewalkingdead.css';
                    return chunkInfo.name || '(name)';
                },
            },
        },
    },
    plugins: [],
};

export default config;

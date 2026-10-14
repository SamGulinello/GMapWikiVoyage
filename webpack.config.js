const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
    mode: 'production', // Use 'production' for production builds
    devtool: "source-map",
    entry: {
        background: path.join(__dirname, 'src', 'background.js'),
        content: path.join(__dirname, 'src', 'content.js')
    },
    output: {
        path: path.join(__dirname, 'dist'),
        filename: '[name].js',
        publicPath: "",
        clean: true
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env']
                    }
                }
            },
            {
                test: /\.js$/,
                exclude: /node_modules/
            },
            {
                test: /\.(png|svg|jpg|gif)$/,
                use: [
                    'file-loader',
                ],
            },
        ]
    },
    plugins: [
        new CopyPlugin({
            patterns: [
                { from: 'public', to: '' } // Copy all assets and the manifest.json from 'public' to 'dist'
            ],
        }),
    ]
};

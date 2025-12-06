module.exports = {
  devIndicators: {
    autoPrerender: false,
  },
  // For local development with HTTPS
  devServer: {
    https: {
      key: './localhost-key.pem',
      cert: './localhost.pem',
    },
  },
}
module.exports = {
  devServer: {
    proxy: {
      '/api': {
        target: 'http://192.168.8.102:8080/',
        pathRewrite: {
          '/api' : ''
        }
      }
    }
  }
}

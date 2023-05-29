const uploadApi = require('./controller/upload.controller');

class Routes {
  constructor(app) {
    this.app = app;
  }
  /* creating app Routes starts */
  appRoutes() {
    //Routes of uploadController
    this.app.post('/upload', uploadApi.uploadImage);
  }
  
  routesConfig() {
    this.appRoutes();
  }
}
module.exports = Routes;
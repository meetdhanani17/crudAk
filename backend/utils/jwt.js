const expressJwt = require('express-jwt');
const publicRoutes = require('./jwt-route');

class JWT {
  constructor(app) {
    this.app = app;
  }

  setJWTConfig() {
    this.app.use(
      expressJwt({
        secret: process.env.JWT_SECRET,
        algorithms: ['HS256']       
      }).unless({
        path: publicRoutes,
      }),
    );
  }
}


module.exports = JWT;
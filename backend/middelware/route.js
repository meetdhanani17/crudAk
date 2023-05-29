const auth = require("./controller/auth");

class Routes {
  constructor(app) {
    this.app = app;
  }

  /* creating app Routes starts */
  appRoutes() {
    //Routes of authentication
    this.app.get("/auth", (req, res) => {
      const { user } = req;

      res.send({
        login: true,
        user: {
          _id: user._id,
          first_name: user.first_name,
          last_name: user.last_name,
          email_address: user.email_address,
          status: user.status,
          is_owner: user.is_owner,
        },
      });
    });
  }

  routesConfig() {
    this.appRoutes();
  }
}

module.exports = Routes;

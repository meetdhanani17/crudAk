const mongoose = require('mongoose');

class MongoDB {
   constructor() {
     this.mongoClient = mongoose;
     this.ObjectID = mongoose.ObjectID;
     this.onConnect();
   }

  onConnect() {
    return new Promise((resolve, reject) => {   
        //Set up default mongoose connection
        // console.log(process.env.MONGODB_DB_URL,"process.env.MONGODB_DB_URL")
        mongoose.connect(
          process.env.MONGODB_DB_URL, {
          useNewUrlParser: true, 
          useUnifiedTopology: true
        });
        mongoose.connection.on('error', function(err) {
          reject(err);
        });
        mongoose.connection.on('connected', function() {
          resolve(mongoose.connection);
        });

    });
  }
}
module.exports = new MongoDB();

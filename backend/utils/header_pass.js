"use strict";
var Header = function () {};
Header.prototype.header_pass = function (uri, header_data) {
  // prepare the header
  var postheaders = {
    //'Content-Type' : 'application/json',
    //'Content-Length' : Buffer.byteLength(jsonObject, 'utf8'),
    authorization: header_data,
  };
  const options = {
    method: "GET",
    uri: uri,
    headers: postheaders,
    json: true,
  };
  return options;
};
module.exports = new Header();

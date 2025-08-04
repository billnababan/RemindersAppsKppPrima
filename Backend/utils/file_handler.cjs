const path = require("path");


const fileDir = () => {
  
  return path.resolve(__dirname, "../files");
};

module.exports = {
  fileDir,
};

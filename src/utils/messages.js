const generateMessage = (username, text) => {
  return {
    username,
    text,
    createdAt: new Date().getTime(),
  };
};
const generateLocationMessage = (username, text) => {
  // console.log(text);
  return {
    username,
    text,
    createdAt: new Date().getTime(),
  };
};

module.exports = {
  generateMessage,
  generateLocationMessage,
};

const generateMessage = (text, sender) => {
  return {
    sender,
    text,
    createdAt: new Date().getTime(),
  };
};

export { generateMessage };

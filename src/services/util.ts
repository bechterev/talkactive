const genTitle = async () => {
  const abc = 'abcdefghijklmnopqrstuvwxyz';
  let rs = '';
  while (rs.length < 10) {
    rs += abc[Math.floor(Math.random() * abc.length)];
  }
  return rs;
};

const delay = (ms: number) => new Promise((resolve) => {
  setTimeout(resolve, ms);
});

export { genTitle, delay };

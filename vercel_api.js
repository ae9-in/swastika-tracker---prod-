export default (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send('<html><body><h1>It works!</h1></body></html>');
};
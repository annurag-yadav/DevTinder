const express = require('express');
const app = express();
const port = 3000;

app.use("/test",(req,res) => {
  res.send('Helllo World!'); });     

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
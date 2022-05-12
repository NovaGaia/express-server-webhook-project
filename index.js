require('dotenv').config();
// Require express, body-parser and child_process
const express = require('express');
const bodyParser = require('body-parser');
const { spawn, exec } = require('node:child_process');

// Initialize express and define a port
const app = express();
const PORT = process.env.API_PORT;

// Tell express to use body-parser's JSON parsing
app.use(bodyParser.json());

app.post('/hook', (req, res) => {
  if (process.env.API_SECRET === req.headers.authorization.split(' ')[1]) {
    console.log('Security check Bearer 👌🏻');
    console.log('CMD is building... ⌛');
    const build = spawn('npm', ['run', 'check:ok']);
    build.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
    });

    build.stderr.on('data', (data) => {
      console.error(`stderr: ${data}`);
    });

    build.on('close', (code) => {
      if (code !== 0) {
        console.log(`build process exited with code ${code}`);
      }
      console.log('CMD builded 🚀');
      res.status(200).end(); // Responding is important
    });
  } else {
    console.log('Security KO Bearer ⛔');
    exec('npm run check:ko');
    res.statusMessage = 'Authorization KO';
    res.status(403).end(); // Responding is important
  }
});

// Start express on the defined port
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

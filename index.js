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

/**
 * ENDPOINT to start action securized by a Bearer
 */
app.post('/hook', (req, res) => {
  if (process.env.API_SECRET === req.headers.authorization.split(' ')[1]) {
    console.log('Security check Bearer 👌🏻');
    exec('echo building > ./status.txt');
    console.log('CMD is building... ⌛');
    const build = spawn('npm', ['run', 'check:ok']); // <-- what to do if security validate
    build.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
    });

    build.stderr.on('data', (data) => {
      console.error(`stderr: ${data}`);
    });

    build.on('close', (code) => {
      if (code !== 0) {
        console.log(`build process exited with code ${code}`);
      } else {
        console.log('CMD builded 🚀');
      }
      exec('echo inactive > ./status.txt');
      res.status(200).end(); // Responding is important
    });
  } else {
    console.log('Security KO Bearer ⛔');
    exec('npm run check:ko'); // <-- what to do if security failed (optional)
    res.statusMessage = 'Authorization KO';
    res.status(403).end(); // Responding is important
  }
});

/**
 * ENDPOINT to check status of Action (no bearer)
 * Responses possibilities : `inactive`, `building` and `empty...`
 */
app.get('/check', (req, res) => {
  exec('echo "$(<status.txt )"', (err, stdout, stderr) => {
    if (err) {
      console.error(err);
      res.statusMessage = err;
      res.status(403).end();
      return;
    }
    if (stdout.trim() === '') {
      res.send('Hook has never run. Come back later...');
    } else {
      res.send(stdout);
    }
  });
});

// Start express on the defined port
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

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
 * @api {get} /docs/ Current documentation
 * @apiName GetAPIDoc
 * @apiGroup Utils
 * @apiDescription ENDPOINT to read the APIs documentation.
 */
app.use('/docs', express.static('docs'));

/**
 * @api {post} /hook/ Trigger Action
 * @apiName TriggerAction
 * @apiGroup Actions
 *
 * @apiHeader {String} Authorization secret Bearer of the Webhooks (required).
 * @apiHeaderExample {Header} Authorization
 *     "Authorization: Bearer 5f048fe"
 *
 * @apiSuccess {Object} result Result of the trigger.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "status": "success"
 *     }
 *
 * @apiError (500) ActionStatusThrowError Action triggered by calling hook API generate an error.
 *
 * @apiErrorExample (500) Error-Response (Action triggered error):
 *     HTTP/1.1 500 KO
 *     {
 *       "status": "failed",
 *       "errorCode": "code"
 *     }
 *
 * @apiError (401) AuthenicationError The Bearer not match or absent.
 *
 * @apiErrorExample (401) Error-Response (Bearer error):
 *     HTTP/1.1 401 KO
 *     {
 *       "status": "Authorization KO"
 *     }
 *
 * @apiDescription ENDPOINT to start action securized by a Bearer.
 *
 * During the action, the `/check` endpoint return `status: building`.
 *
 * After the action ended, the `/check` endpoint return `status: inactive`.
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
        res.status(500).send({ status: 'failed', errorCode: code }).end(); // Responding is important
        return;
      } else {
        console.log('CMD builded 🚀');
      }
      exec('echo inactive > ./status.txt');
      res.status(200).send({ status: 'success' }).end(); // Responding is important
    });
  } else {
    console.log('Security KO Bearer ⛔');
    exec('npm run check:ko'); // <-- what to do if security failed (optional)
    res.statusMessage = 'Authorization KO';
    res.status(401).send({ status: 'Authorization KO' }).end(); // Responding is important
  }
});

/**
 * @api {get} /check/ Request Hook status
 * @apiName GetStatus
 * @apiGroup Utils
 *
 * @apiSuccess {Object} status `inactive`, `building` and `empty...`.
 *
 * @apiSuccessExample Success-Response (inactive):
 *     HTTP/1.1 200 OK
 *     {
 *       "status": "inactive"
 *     }
 * @apiSuccessExample Success-Response (building):
 *     HTTP/1.1 200 OK
 *     {
 *       "status": "building"
 *     }
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "status": "Hook has never run. Come back later..."
 *     }
 *
 * @apiError (500) ActionStatusNotFound Status Action triggered by calling hook API was not found.
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 500 KO
 *     {
 *       "status": "Error",
 *       "message": "<Error explanation>"
 *     }
 *
 * @apiDescription ENDPOINT to check status of Action triggered by `/hook` (no bearer mandatory).
 *
 * Responses possibilities : `inactive`, `building` and `empty...`
 */
app.get('/check', (req, res) => {
  const response = {};
  exec('echo "$(<status.txt )"', (err, stdout, stderr) => {
    if (err) {
      console.error(err);
      res.statusMessage = err;
      res.status(500).send({ status: 'Error', message: err }).end();
      return;
    }
    if (stdout.trim() === '') {
      response['status'] = 'Hook has never run. Come back later...';
      res.send(response);
    } else {
      response['status'] = stdout.trim();
      res.send(response);
    }
  });
});

// Start express on the defined port
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

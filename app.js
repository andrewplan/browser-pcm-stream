var express = require('express');
var BinaryServer = require('binaryjs').BinaryServer;
var fs = require('fs');
var wav = require('wav');
const lame = require( 'lame' );
const googleSpeechConfig = require( './configs/googleSpeechConfig' );
// Imports the Google Cloud client library
const Speech = require('google-cloud/node_modules/@google-cloud/speech');

// Your Google Cloud Platform project ID
const projectId = googleSpeechConfig.project_id;

process.env.GOOGLE_APPLICATION_CREDENTIALS = './configs/googleSpeechCredentials.json';

var port = 3700;
var outFile = 'demo.wav';
var app = express();

app.set('views', __dirname + '/tpl');
app.set('view engine', 'jade');
app.engine('jade', require('jade').__express);
app.use(express.static(__dirname + '/public'))

app.get('/', function(req, res){
  res.render('index');
});

app.listen(port, () => { console.log('server open on port ' + port) } );



binaryServer = BinaryServer({port: 9001});

binaryServer.on('connection', function(client) {
  console.log('new connection');

  var fileWriter = new wav.FileWriter(outFile, {
    channels: 1,
    sampleRate: 44000,
    bitDepth: 16
  });

  client.on('stream', function(stream, meta) {
    console.log('new stream');
    let streamClone = require( 'stream' );

    let stream1 = stream.pipe( new streamClone.PassThrough() );

    stream1.pipe(fileWriter);

    stream1.on('end', function() {
      fileWriter.end();
      console.log('wrote to file ' + outFile);

      // Instantiates a client
      const speechClient = Speech({
        projectId: projectId
      });

      // The name of the audio file to transcribe
      const fileName = outFile;

      // The audio file's encoding and sample rate
      const options = {
        encoding: 'LINEAR16',
        sampleRate: 44000
      };

      // Detects speech in the audio file
      speechClient.recognize(fileName, options, (err, result) => {
        if (err) {
          console.error(err);
          return;
        }

        console.log(`Transcription: ${result}`);


      });


      // transcode file to mp3
      // upload mp3 to Amazon S3
      // call mongoDB method to POST obj with S3 URL and transcription
          // then front end could make get request for the data posted to mongoDB
      // delete wav from server
    });
  });
});

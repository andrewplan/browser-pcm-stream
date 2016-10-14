var express = require('express');
// var BinaryServer = require('binaryjs').BinaryServer;
var fs = require('fs');
const path = require( 'path' );
var wav = require('wav');
const lame = require( 'lame' );
const googleSpeechConfig = require( './configs/googleSpeechConfig' );
const Speech = require('google-cloud/node_modules/@google-cloud/speech');
const projectId = googleSpeechConfig.project_id;

process.env.GOOGLE_APPLICATION_CREDENTIALS = './configs/googleSpeechCredentials.json';

var port = 3700;
var outFile = 'demo.wav';

var app = express();
var http = require( 'http' ).Server( app );
var io = require( 'socket.io' )( http );
const ss = require( 'socket.io-stream' );

app.set('views', __dirname + '/tpl');
app.set('view engine', 'jade');
app.engine('jade', require('jade').__express);
app.use(express.static(__dirname + '/public'))

app.get('/', function(req, res){
  res.render('index');
});

http.listen(port, () => { console.log('server open on port ' + port) } );


// binaryServer = BinaryServer({port: 9001});

// binaryServer.on('connection', function(client) {
io.on( 'connection', function( socket ) {
  console.log('new connection');

  var fileWriter = new wav.FileWriter(outFile, {
    channels: 1,
    sampleRate: 44000,
    bitDepth: 16
  });

  ss( socket ).on('stream', function(stream, meta) {
    console.log('new stream');
    console.log( 'stream is ', stream );
    let streamClone = require( 'stream' );

    let stream1 = stream.pipe( new streamClone.PassThrough() );
    let stream2 = stream.pipe( new streamClone.PassThrough() );

    stream1.pipe(fileWriter);

    socket.on('end', function() {
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
    });

    stream2
      .pipe( new lame.Encoder( {
          channels: 1
          , bitDepth: 16
          , float: false

          , bitRate: 192
          , outSampleRate: 44100
          , mode: lame.STEREO
        } ) )
      .pipe( fs.createWriteStream( path.resolve( __dirname, 'demo.mp3' ) ) )
      .on( 'close', () => { console.log( 'Done encoding to mp3' ); } );
      // transcode file to mp3
      // upload mp3 to Amazon S3
      // call mongoDB method to POST obj with S3 URL and transcription
          // then front end could make get request for the data posted to mongoDB
      // delete wav from server
  });
});

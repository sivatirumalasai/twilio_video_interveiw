require("dotenv").config();
const { v4: uuidv4 } = require("uuid");
const AccessToken = require("twilio").jwt.AccessToken;
const Joi = require('joi')
  .extend(require('@joi/date'));
const { validate, ValidationError } = require('express-validation')
const VideoGrant = AccessToken.VideoGrant;
const express = require("express");
const app = express();
const port = 5000;
const db = require('./db');
const InterviewMeets = db.interview_meets;
const path = require("path");
var moment = require('moment');

var cors = require('cors')
app.use(cors());
app.use(express.static("public"));
// use the Express JSON middleware
app.use(express.json());

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
const createValidation = {
  body: Joi.object({
    client_id: Joi.number()
      .required(),
    candidate_id: Joi.number()
      .required(),
    interview_duration: Joi.number()
      .required(),
    interview_date: Joi.required() //2022-10-20 13:27:35
  }),
}



app.get("/room/:room_id", async (req, res) => {
  console.log('date', moment().format('YYYY-MM-DD H:mm:ss'));
  let interview_meets = await InterviewMeets.findOne({
    where: {
      room_id: req.params.room_id,
      status: 0,
    }
  })
  if (interview_meets) {
    let interview_date = moment(interview_meets.interview_date);
    let mindate = moment(interview_meets.interview_date).subtract(30, 'm');
    let maxdate = moment(interview_meets.interview_date).add(interview_meets.duration, 'm');
    let currentdate = moment();
    if (currentdate.isBetween(mindate, maxdate) || true) {
      return res.render("index", { room_id: req.params.room_id });
    }
    return res.render("404", { message: "meeting link expired or not yet started", 'status': 400 });
    // return res.status(400).json({ 'status': false, date:currentdate,mindate:mindate,maxdate:maxdate,interview_date:interview_date, "message": ""});
  }
  else {

    res.render("404", { message: "Not Found", 'status': 404 });
  }



});
app.post("/join-room/:roomName", async (req, res) => {
  const roomName = req.params.roomName;

  let interview_meets = await InterviewMeets.findOne({
    where: {
      room_id: roomName,
      status: 0,
    }
  })
  if (!interview_meets) {
    res.status(400).json({ 'status': false, "message": "Interview Meet is not found", data: interview_meets });
  } else {
    // if (moment().diff(interview_meets.interview_date, 'minutes') && true) {
    //   res.status(400).json({ 'status': false, "message": "Interview Meet is not found","interview_meets":interview_meets, data: moment().diff(interview_meets.interview_date, 'minutes') });
    // }
    // return 400 if the request has an empty body or no roomName
    if (!req.params || !req.params.roomName) {
      return res.status(400).send("Must include roomName argument.");
    }
    // find or create a room with the given roomName
    let room_status = await findOrCreateRoom(roomName);
    console.log('room_status', roomName)
    // generate an Access Token for a participant in this room
    const token = getAccessToken(roomName, req.body.userName);

    res.send({
      token: token,
    });
  }
});
app.post("/endMeetLink", async (req, res) => {
  const room_id = req.body.room_id;
  if (room_id) {
    let interview=await InterviewMeets.findOne({
      where:{
        room_id:room_id
      }
    })
    if(interview){
      let interview_meets = await InterviewMeets.update(
        { status: 1 }, {
        where: {
          room_id: room_id,
  
        }
      })
      return res.status(200).json({ 'status': true, "message": "Success" });
    }
    
    return res.status(400).json({ 'status': false, "message": "Invalid Data" });

  }
  else {
    return res.status(400).json({ 'status': false, "message": "Invalid Data" });

  }



});
app.post("/createMeetLink", validate(createValidation, {}, {}), async (req, res) => {

  if (req.body.client_id && req.body.candidate_id && req.body.interview_date && req.body.interview_duration) {

    let interview_meets = await InterviewMeets.findOne({
      where: {
        client_id: req.body.client_id,
        attendee_id: req.body.candidate_id,
        interview_date: req.body.interview_date,
      }
    })
    if (interview_meets) {
      res.status(400).json({ 'status': false, "message": "One Interview is already scheduled on this client and candidate with same date", data: interview_meets });
    }
    else {
      let room_id = generateRandomString(15);
      let new_interview_link = await InterviewMeets.create({
        client_id: req.body.client_id,
        attendee_id: req.body.client_id,
        room_id: room_id,
        interview_link: 'https://interview.bevov.com/room/' + room_id,
        client_status: 0,
        attendee_status: 0,
        status: 0,
        token: generateRandomString(15),
        interview_date: moment(req.body.interview_date).format('YYYY-MM-DD H:mm:ss'),
        duration: req.body.interview_duration
      })
      res.status(200).json({ 'status': true, "message": "Meeting Link Created", data: new_interview_link });
    }
  }
  else {
    res.status(400).json({ 'status': false, "message": "Invalid Data" });

  }
});
app.use(function (err, req, res, next) {
  if (err instanceof ValidationError) {

    return res.status(err.statusCode).json({ status: false, message: err.details.body[0].message })
  }
  return res.status(500).json(err)
})
// Start the Express server
app.listen(port, () => {
  console.log(`Express server running on port ${port}`);
});
// create the twilioClient
const twilioClient = require("twilio")(
  process.env.TWILIO_API_KEY_SID,
  process.env.TWILIO_API_KEY_SECRET,
  { accountSid: process.env.TWILIO_ACCOUNT_SID }
);
const findOrCreateRoom = async (roomName) => {
  try {
    // see if the room exists already. If it doesn't, this will throw
    // error 20404.
    return await twilioClient.video.rooms(roomName).fetch();
  } catch (error) {
    // the room was not found, so create it
    if (error.code == 20404) {
      return await twilioClient.video.rooms.create({
        uniqueName: roomName,
        type: "go",
      });
    } else {
      // let other errors bubble up
      throw error;
    }
  }
};
const getAccessToken = (roomName, userName) => {
  // create an access token
  const token = new AccessToken(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_API_KEY_SID,
    process.env.TWILIO_API_KEY_SECRET,
    // generate a random unique identity for this participant
    { identity: userName }
  );
  // create a video grant for this specific room
  const videoGrant = new VideoGrant({
    room: roomName,
  });

  // add the video grant
  token.addGrant(videoGrant);
  // serialize the token and return it
  return token.toJwt();
};
const generateRandomString = function (length) {
  var result = '';
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() *
      charactersLength));
  }
  return result;
}
//our username 
var name; 
var connectedUser;
  
//connecting to our signaling server 
var conn = new WebSocket('ws://192.168.1.13:8080/socket');
  
conn.onopen = function () { 
   console.log("Connected to the signaling server"); 
}; 
 
//when we got a message from a signaling server 
conn.onmessage = function (msg) { 
   console.log("Got message", msg.data);  
   var data = JSON.parse(msg.data);  
	
   switch(data.type) { 
      case "login": 
         handleLogin(data.success); 
         break; 
      //when somebody wants to call us 
      case "offer": 
         handleOffer(data.offer, data.name); 
         break; 
      case "answer": 
         handleAnswer(data.answer); 
         break; 
      //when a remote peer sends an ice candidate to us 
      case "candidate": 
         handleCandidate(data.candidate); 
         break;
      case "leave": 
         handleLeave(); 
         break; 
      default: 
         break; 
   } 
};
  
conn.onerror = function (err) { 
   console.log("Got error", err); 
};
  
//alias for sending JSON encoded messages 
function send(message) { 
   //attach the other peer username to our messages
   if (connectedUser) {
      message.name = connectedUser;
   }

   conn.send(JSON.stringify(message)); 
};
function sendMessage(){
//    console.log("hello world!")
    var message = $("#message-box").val();
    this.send({message: message})
}

var yourConn;
var stream;
function getAudio() {
       var configuration = {
          "iceServers": [{ "url": "stun:stun2.1.google.com:19302" }]
       };
       yourConn = new webkitRTCPeerConnection(configuration);
      //when a remote user adds stream to the peer connection, we display it
      yourConn.onaddstream = function (e) {
//              remoteAudio.src = window.URL.createObjectURL(e.stream);
           var video = document.getElementById('vid-ply');
           video.srcObject = e.stream;
      };

      // Setup ice handling
      yourConn.onicecandidate = function (event) {
         if (event.candidate) {
            send({
               type: "candidate",
               candidate: event.candidate
            });
         }
      };

     navigator.mediaDevices.getDisplayMedia({
       video: false,
       audio: true
      }).then((input)=>{
           console.log(input)
           stream = input;
           //using Google public stun server

           // setup stream listening
           yourConn.addStream(stream);

      })



};

//initiating a call
function call() {
    connectedUser  = $("#call-to-user").val();
      // create an offer
      yourConn.createOffer(function (offer) {
         send({
            type: "offer",
            offer: offer
         });

         yourConn.setLocalDescription(offer);

      }, function (error) {
         alert("Error when creating an offer");
      });

}

function end() {
   send({
      type: "leave"
   });

   handleLeave();
}

function handleLeave() {
   connectedUser = null;
   remoteAudio.src = null;

   yourConn.close();
   yourConn.onicecandidate = null;
   yourConn.onaddstream = null;
};

//when somebody sends us an offer
function handleOffer(offer, name) {
   connectedUser = name;
   yourConn.setRemoteDescription(new RTCSessionDescription(offer));

   //create an answer to an offer
   yourConn.createAnswer(function (answer) {
      yourConn.setLocalDescription(answer);

      send({
         type: "answer",
         answer: answer
      });

   }, function (error) {
      alert("Error when creating an answer");
   });

};

//when we got an answer from a remote user
function handleAnswer(answer) {
   yourConn.setRemoteDescription(new RTCSessionDescription(answer));
};

//when we got an ice candidate from a remote user
function handleCandidate(candidate) {
   yourConn.addIceCandidate(new RTCIceCandidate(candidate));
};
var connection = new WebSocket('wss://192.168.0.104:3000');
let ussserData;
var callStatus = false;

// var connection = new WebSocket('wss://192.168.0.106:8000');
connection.onopen = function () {
    console.log('connected');
}

connection.onmessage = function (msg) {
    var data = JSON.parse(msg.data);
    ussserData = data;
    switch (data.type) {
        case "online":

            onlineProcess(data.success);

            // console.log(data);
            break;
        case "not_available":
            call_status.innerHTML = '';
            alert(data.name + " not Available");
            call_btn.removeAttribute("disabled");
            break;
        case "busy_user":
            alert(data.name + " is busy. Please try again later.");
            call_btn.removeAttribute("disabled");
            break;
        case "offer":


            if (callStatus) {
                send({
                    type: "user_busy",
                    remote_user: name,
                    caller: data.name
                });
                return;
            }
            call_btn.setAttribute("disabled", "disabled");
            call_status.innerHTML = `<div class="calling-status-wrap card black white-text"> <div class="user-image"> <img src="${data.image}" class="caller-image circle" alt=""> </div> <div class="user-name">${data.name}</div> <div class="user-calling-status">Calling...</div> <div class="calling-action"> <div class="call-accept"><i class="material-icons green darken-2 white-text audio-icon">call</i></div> <div class="call-reject"><i class="material-icons red darken-3 white-text close-icon">close</i></div> </div> </div>`;

            var call_accept = document.querySelector('.call-accept');
            var call_reject = document.querySelector('.call-reject');
            call_accept.addEventListener("click", function () {
                offerProcess(data.offer, data.name);
                call_status.innerHTML = `<div class="call-status-warp white-text"><div class="calling-warp"> <div class="calling-hang-action"> <div class="audio-on"><i class="material-icons purple darken-2 white-text audio-toggle">mic</i> </div> <div class="call-cancel"><i class="call-cancel-icon material-icons red darken-3 white-text ">call</i></div></div></div></div>`;
                acceptCall(data.name);

                // var video_toggle = document.querySelector(".videocam-on");
                var audio_toggle = document.querySelector(".audio-on");

                // video_toggle.onclick = function () {
                //     stream.getVideoTracks()[0].enabled = !(stream.getVideoTracks()[0].enabled);

                //     var video_toggle_class = document.querySelector(".video-toggle");
                //     if (video_toggle_class.innerText == 'videocam') {
                //         video_toggle_class.innerText = 'videocam_off';
                //     }
                //     else {
                //         video_toggle_class.innerText = 'videocam';
                //     }
                // }
                audio_toggle.onclick = function () {
                    stream.getAudioTracks()[0].enabled = !(stream.getAudioTracks()[0].enabled);

                    var audio_toggle_class = document.querySelector(".audio-toggle");
                    if (audio_toggle_class.innerText == 'mic') {
                        audio_toggle_class.innerText = 'mic_off';
                    }
                    else {
                        audio_toggle_class.innerText = 'mic';
                    }
                }
            });
            call_reject.addEventListener("click", function () {
                call_status.innerHTML = '';
                alert('Call is rejected!!!')
                call_btn.removeAttribute("disabled");
                rejectedCall(data.name);
            });
            break;
        case "answer":
            answerProcess(data.answer);
            break;
        case "candidate":
            candidateProcess(data.candidate);
            break;
        case "reject":

            rejectProcess();
            break;
        case "accept":
            acceptProcess();
            break;
        case "hangup":
            hangupProcess();
            break;
        default:
            break;
    }
}
connection.onerror = function (error) {
    // console.log(error.toString());
    console.log('Error Code:', error.code);
}

var name;
var connectedUser;
var myConn;
// var isCallInProgress = false;
var userAlreadyInCall; // Declare this variable to track users in a call.

var remote_video = document.querySelector('#remote-video');
var call_to_username_input = document.querySelector('#username-input');
var call_btn = document.querySelector('#call-btn');
var call_status = document.querySelector('.call-hang-status');


const browserSupportsMedia = () => {
    return navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia
}

call_btn.addEventListener("click", function () {
    var call_to_username = call_to_username_input.value;
    if (call_to_username.length > 0) {
        connectedUser = call_to_username.toLowerCase();
        if (username == connectedUser) {
            alert("You can't call to yourself!!!");
        }
        else if (connectedUser === userAlreadyInCall) {
            alert("User is already in a call. You cannot make another call.");
        }
        else if (callStatus) {
            alert("The remote user's line is busy. Please try again later.");
        }
        else {
            call_status.innerHTML = `<div class="calling-status-wrap card black white-text"> <div class="user-image"> <img src="/public/images/bg.jpg" class="caller-image circle" alt=""> </div> <div class="user-name">unknown</div> <div class="user-calling-status">Calling...</div> <div class="call-reject"><i class="material-icons red darken-3 white-text close-icon">close</i></div> </div> </div>`;

            setUserProfile(connectedUser);

            var call_reject = document.querySelector('.call-reject');
            call_reject.addEventListener("click", function () {
                call_status.innerHTML = '';
                // alert('Call is rejected!!!')
                call_btn.removeAttribute("disabled");
                rejectedCall(connectedUser);

            });

            call_btn.setAttribute("disabled", "disabled");
            if (!myConn) {
                onlineProcess(true);
            }
            setTimeout(() => {
                let nnn = document.getElementById('username-input').value;

                myConn.createOffer(function (offer) {
                    send({
                        type: "offer",
                        offer: offer,
                        image: userImage,
                        callStatus: true,
                        remote_user: nnn,
                        caller: name,
                    });
                    myConn.setLocalDescription(offer);
                }, function (error) {
                    alert("Offer has not created!", error.message);
                    console.log(error);
                    console.log(error.message);
                });
                userAlreadyInCall = connectedUser;
                callStatus = true;
            }, 5000)
        }
    }
    else {
        alert('Enter Username!')
    }
});

setTimeout(function () {
    if (connection.readyState == 1) {
        if (username != null) {
            name = username;
            // console.log("username is :" + name);

            var usernameDisplay = document.getElementById("username-display");
            usernameDisplay.innerHTML = "Logged in as: " + name;
            send({
                type: "online",
                name: name
            });
        }
    }
    else {
        console.log('something is wrong');
    }
}, 1000);

function send(message) {
    if (connectedUser) {
        message.name = connectedUser;
    }
    connection.send(JSON.stringify(message));
}

//online process 
function onlineProcess(success) {
    if (success) {
        navigator.getUserMedia({
            video: true,
            audio: {
                echoCancellationType: 'system',
                echoCancellation: true,
                noiseSuppression: true,
                sampleRate: 24000,
                sampleSize: 16,
                channelCount: 1,
                volume: 1
            },

            // audio: true,
        },
            (stream) => {

                var local_video = document.querySelector('#local-video');
                console.log(local_video);
                local_video.srcObject = new MediaStream([stream.getVideoTracks()[0]]);
                local_video.addEventListener("loadedmetadata", () => local_video.play());

                var configuration = {
                    "iceServers": [
                        { "url": "stun:stun2.1.goggle.cpm:19302" },
                        { "url": "stun:stun1.1.goggle.cpm:19302" },
                        { "url": "stun:stun3.1.goggle.cpm:19302" },
                        { "url": "stun:stun4.1.goggle.cpm:19302" },
                        { "url": "stun:stun5.1.goggle.cpm:19302" }
                    ]
                }
                myConn = new webkitRTCPeerConnection(configuration, {
                    optional: [{
                        RtpDataChannels: true
                    }]
                });
                myConn.addStream(stream);
                myConn.onaddstream = function (e) {
                    remote_video.srcObject = e.stream;
                    call_status.innerHTML = `<div class="call-status-warp white-text"><div class="calling-warp"> <div class="calling-hang-action"> <div class="audio-on"><i class="material-icons purple darken-2 white-text audio-toggle">mic</i> </div> <div class="call-cancel"><i class="call-cancel-icon material-icons red darken-3 white-text ">call</i></div></div></div></div>`;

                    var audio_toggle = document.querySelector(".audio-on");

                    audio_toggle.onclick = function () {
                        stream.getAudioTracks()[0].enabled = !(stream.getAudioTracks()[0].enabled);

                        var audio_toggle_class = document.querySelector(".audio-toggle");
                        if (audio_toggle_class.innerText == 'mic') {
                            audio_toggle_class.innerText = 'mic_off';
                        }
                        else {
                            audio_toggle_class.innerText = 'mic';
                        }
                    }

                    hangUp();
                }

                myConn.onicecandidate = function (event) {
                    if (event.candidate) {
                        send({
                            type: "candidate",
                            candidate: event.candidate
                        })
                    }
                }
            },
            (error) => {
                alert("you can't access media");
            }
        );
    }
    else {
        alert('getUserMedia is not supported')
    }
}

function offerProcess(offer, name) {
    connectedUser = name;
    console.log(connectedUser);
    myConn.setRemoteDescription(new RTCSessionDescription(offer));

    //crate answer to 1st user or an offer
    myConn.createAnswer(function (answer) {
        myConn.setLocalDescription(answer);

        send({
            type: "answer",
            answer: answer
        });

    }, function (error) {
        alert("Answer has not created!");
    });
}

function answerProcess(answer) {
    myConn.setRemoteDescription(new RTCSessionDescription(answer));
}

function candidateProcess(candidate) {
    myConn.addIceCandidate(new RTCIceCandidate(candidate));
}

function setUserProfile(name) {
    var xhtr = new XMLHttpRequest();
    xhtr.open("GET", "/get-user-profile?name=" + name, true);
    xhtr.send();

    xhtr.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            // console.log(this.responseText);
            var obj = JSON.parse(this.responseText);
            if (obj.success) {
                var data = obj.data;
                var caller_image = document.querySelector('.caller-image');
                var user_name = document.querySelector('.user-name');

                caller_image.setAttribute('src', data.image);
                user_name.innerHTML = data.name;

            }
        }
    };
}

function rejectedCall(rejected_user) {
    send({
        type: "reject",
        name: rejected_user,

    });
}
function resetCall() {
    connectedUser = null;
    if (myConn) {
        myConn.close();
        myConn.onicecandidate = null;
        myConn.onaddstream = null;
    }
    myConn = null;
    userAlreadyInCall = null;
}

function rejectProcess() {
    call_status.innerHTML = '';
    call_btn.removeAttribute("disabled");
    // isCallInProgress = false; // Reset the call status


}

function acceptCall(call_name) {
    send({
        type: "accept",
        name: call_name
    })
}
function acceptProcess() {
    call_status.innerHTML = '';
}

function hangUp() {
    var call_cancel = document.querySelector(".call-cancel");
    call_cancel.addEventListener("click", function () {
        callStatus = false;
        send({
            type: "hangup",
            callStatus: false

        });
        hangupProcess()

    });
}
function hangupProcess() {
    console.log('hangup process being called');
    call_btn.removeAttribute("disabled");
    call_status.innerHTML = '';
    remote_video.src = null;
    // myConn.close();
    if (myConn) {
        myConn.close();
        console.log('myConn just closed this time');
        myConn.onicecandidate = null;
        myConn.onaddstream = null;
    }
    myConn = null;
    // myConn.onicecandidate = null;
    // myConn.onaddstream = null;
    connectedUser = null;
}

{/* <div class="call-status-warp white-text"><div class="calling-warp"> <div class="calling-hang-action"><div class="videocam-on"><i class="material-icons purple darken-2 white-text video-toggle">videocam</i></div> <div class="audio-on"><i class="material-icons purple darken-2 white-text audio-toggle">mic</i> </div> <div class="call-cancel"><i class="call-cancel-icon material-icons red darken-3 white-text ">call</i></div></div></div></div> */ }
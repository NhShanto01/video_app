var connection = new WebSocket("ws://localhost:8000");
connection.onopen = function () {
    console.log('connected');
}

connection.onmessage = function (msg) {
    var data = JSON.parse(msg.data);
    switch (data.type) {
        case "online":
            onlineProcess(data.success);
            // console.log(data);
            break;
        case "not_available":
            call_status.innerHTML = '';
            alert(data.name + " User not Available");
            call_btn.removeAttribute("disabled");
            break;
        case "offer":
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
    console.log(error);
}

var name;
var connectedUser;
var myConn;
var local_video = document.querySelector('#local-video');
var remote_video = document.querySelector('#remote-video');
var call_to_username_input = document.querySelector('#username-input');
var call_btn = document.querySelector('#call-btn');
var call_status = document.querySelector('.call-hang-status');
console.log(local_video);

navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

call_btn.addEventListener("click", function () {
    var call_to_username = call_to_username_input.value;
    if (call_to_username.length > 0) {
        connectedUser = call_to_username.toLowerCase();
        if (username == connectedUser) {
            alert("You can't call to yourself!!!");
        }
        else {
            call_status.innerHTML = `<div class="calling-status-wrap card black white-text"> <div class="user-image"> <img src="/public/images/bg.jpg" class="caller-image circle" alt=""> </div> <div class="user-name">unknown</div> <div class="user-calling-status">Calling...</div> <div class="call-reject"><i class="material-icons red darken-3 white-text close-icon">close</i></div> </div> </div>`;

            setUserProfile(connectedUser);

            var call_reject = document.querySelector('.call-reject');
            call_reject.addEventListener("click", function () {
                call_status.innerHTML = '';
                alert('Call is rejected!!!')
                call_btn.removeAttribute("disabled");
                rejectedCall(connectedUser);
            });

            call_btn.setAttribute("disabled", "disabled");
            myConn.createOffer(function (offer) {
                send({
                    type: "offer",
                    offer: offer,
                    image: userImage
                });
                myConn.setLocalDescription(offer);
            }, function (error) {
                alert("Offer has not created!");
            });
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
            console.log("username is :" + name)
            send({
                type: "online",
                name: name
            });
        }
    }
    else {
        console.log('something is wrong');
    }
}, 3000);

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
            audio: true,
        },
            function (myStream) {
                stream = myStream;
                local_video.srcObject = stream;

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
            function (error) {
                alert("you can't access media");
            }
        );
    }
    else {
        alert('something wrong')
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
        name: rejected_user
    });
}

function rejectProcess() {
    call_status.innerHTML = '';
    call_btn.removeAttribute("disabled")
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
        send({
            type: "hangup"

        });
        hangupProcess()
    });
}
function hangupProcess() {
    call_btn.removeAttribute("disabled");
    call_status.innerHTML = '';
    remote_video.src = null;
    myConn.close();
    myConn.onicecandidate = null;
    myConn.onaddstream = null;
    connectedUser = null;
}

{/* <div class="call-status-warp white-text"><div class="calling-warp"> <div class="calling-hang-action"><div class="videocam-on"><i class="material-icons purple darken-2 white-text video-toggle">videocam</i></div> <div class="audio-on"><i class="material-icons purple darken-2 white-text audio-toggle">mic</i> </div> <div class="call-cancel"><i class="call-cancel-icon material-icons red darken-3 white-text ">call</i></div></div></div></div> */}
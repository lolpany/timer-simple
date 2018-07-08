var mode;
var secondsInHour = 60 * 60;
var startTime = 0;
var timeToCountInSeconds = 0;
var countedSeconds = null;
var tickIntervalId = null;
var NUMBER_OF_TIME_INPUTS = 6;
var NUM_SIZE = 1;
var lastTimer = 0;
var PAUSE_LABEL = 'PAUSE';
var POP_TIME_DATA_ATTRIBUTE = 'data-time';
var POP_TIME_INDEX = 'data-time-index';
var INPUT_TIME_INDEX = 'data-time-index';
// var DRAGGED_POP_TIME_INDEX = 'data-dragged-pop-time-index';
var POP_TIMES_SIZE = 14;
var popTimes = {};
var isPopTimeDrag = false;
var dataTransfer;
var timeCursorPosition = 0;
var timeInputMap = {};

var ring = new Audio('ring.mp3');
ring.volume = 0.8;
ring.addEventListener('timeupdate', function () {
    var buffer = .5;
    if (this.currentTime > this.duration - buffer) {
        ring.currentTime = 0;
        ring.play();
    }
}, false);

function parseUrl(url) {
    // var paths = getLocation(url).pathname.substr(1).split("-");
    var paths = window.location.search.substr(1).split("-");
    var result = 0;
    for (var i = 0; i < paths.length; i++) {
        if (paths[i].lastIndexOf("hour") !== -1) {
            result += parseInt(paths[i].substr(0, paths[i].lastIndexOf("hour"))) * secondsInHour;
        } else if (paths[i].lastIndexOf("minute") !== -1) {
            result += parseInt(paths[i].substr(0, paths[i].lastIndexOf("minute"))) * 60;
        } else if (paths[i].lastIndexOf("second") !== -1) {
            result += parseInt(paths[i].substr(0, paths[i].lastIndexOf("second")));
        }
    }
    return result;
}

var getLocation = function (href) {
    var l = document.createElement("a");
    l.href = href;
    return l;
};

function onload() {
    if (localStorage.length == 0) {
        localStorage.setItem('0', '{"time": "5", "usage":0}');
        localStorage.setItem('1', '{"time": "10", "usage":0}');
        localStorage.setItem('2', '{"time": "15", "usage":0}');
        localStorage.setItem('3', '{"time": "20", "usage":0}');
        localStorage.setItem('4', '{"time": "30", "usage":0}');
        localStorage.setItem('5', '{"time": "45", "usage":0}');
        localStorage.setItem('6', '{"time": "60", "usage":0}');
        localStorage.setItem('7', '{"time": "90", "usage":0}');
        localStorage.setItem('8', '{"time": "120", "usage":0}');
        localStorage.setItem('9', '{"time": "180", "usage":0}');
        localStorage.setItem('10', '{"time": "300", "usage":0}');
        localStorage.setItem('11', '{"time": "600", "usage":0}');
        localStorage.setItem('12', '{"time": "1800", "usage":0}');
        localStorage.setItem('13', '{"time": "3600", "usage":0}');
        localStorage.setItem('restartTime', '0');
        // localStorage.setItem('14', '{"time": "7200", "usage":0}');
    }
    timeToCountInSeconds = parseUrl(window.location.href);
    setViewTime(timeToCountInSeconds);
    // dragTimeLabel();
    popTimesInit();
    document.getElementsByClassName('restart')[0].addEventListener('mouseover', restartMouseOver);
    document.getElementsByClassName('restart')[0].addEventListener('touchstart', restartMouseOver);
    document.getElementsByClassName('restart')[0].addEventListener('mouseleave', restartMouseLeave);
    document.getElementsByClassName('restart')[0].addEventListener('touchend', restartMouseLeave);
    var inputs = document.getElementsByClassName("timeInput");
    for (var i = 0; i < inputs.length; i++) {
        var input = inputs.item(i);
        if (i < inputs.length - 1) {
            input.next = inputs.item(i + 1);
        }
        if (i > 0) {
            input.prev = inputs.item(i - 1);
        }
    }
    drawRestartTime(parseInt(localStorage.getItem('restartTime')));
    for (var i = 0; i < POP_TIMES_SIZE; i++) {
        popTimes[i] = JSON.parse(localStorage.getItem(i.toString()));
    }
    lastTimer = parseInt(localStorage.getItem('restartTime'));
    drawPopTimes();
    var inputs = document.getElementsByClassName('timeInput');
    for (var i in Object.getOwnPropertyNames(inputs)) {
        inputs[i].addEventListener('mousedown', timeInputOnMousedown);
        inputs[i].setAttribute(INPUT_TIME_INDEX, i.toString());
    }
    for (var i = 0; i < NUM_SIZE * inputs.length; i++) {
        timeInputMap[i] = inputs[Math.floor(i / NUM_SIZE)];
    }
    timeInputMap[NUM_SIZE * inputs.length] = inputs[inputs.length - 1];
    mode = 'stopped';
    setMode(mode);
    drawStartStop();
    setTimeCursorPosition(timeCursorPosition);
}

function timeInputOnMousedown(e) {
    e.preventDefault();
    var timeInput = getParentWithClass(e.target, 'timeInput');
    setTimeCursorPosition(parseInt(timeInput.getAttribute(INPUT_TIME_INDEX)) * NUM_SIZE);
}

function popTimeDragStart(e) {
    var popTime = getParentWithClass(e.target, 'popTime');
    var data = JSON.stringify({
        time: popTime.getAttribute(POP_TIME_DATA_ATTRIBUTE),
        index: popTime.getAttribute(POP_TIME_INDEX)
    });
    // e.dataTransfer.setData("text/plain", '{"": ' + popTime.getAttribute(POP_TIME_DATA_ATTRIBUTE) + ', :}');
    e.dataTransfer.setData("text/plain", data);
    dataTransfer = data;
    isPopTimeDrag = true;
}

function popTimeMouseOver(e) {
    var popTime = getParentWithClass(e.target, 'popTime');
    setPopTimeViewState(popTime, 'hover');
    var popTimes = document.getElementsByClassName('popTime');
    for (var i in Object.getOwnPropertyNames(popTimes)) {
        if (!popTimes[i].isSameNode(popTime)) {
            setPopTimeViewState(popTimes[i], 'highlight');
        }
    }
}

function setPopTimeViewState(popTimeView, state) {
    popTimeView.classList.remove('hover');
    popTimeView.classList.remove('highlight');
    popTimeView.classList.remove('start');
    popTimeView.classList.remove('stop');
    popTimeView.classList.add(state);
}

function popTimeMouseLeave() {
    var popTimesElements = document.getElementsByClassName('popTime');
    for (var i in Object.getOwnPropertyNames(popTimesElements)) {
        // if (!popTimes[i].isSameNode(e.target)) {
        setPopTimeViewState(popTimesElements[i], 'start');
        // }
    }
}

function popTimesInit() {
    var popTimesViews = document.getElementsByClassName('popTime');
    for (var i in Object.getOwnPropertyNames(popTimesViews)) {
        popTimesViews[i].draggable = true;
        popTimesViews[i].addEventListener('click', popTimeClick);
        popTimesViews[i].addEventListener('dragstart', popTimeDragStart);
        popTimesViews[i].addEventListener('dragend', popTimeDragEnd);
        popTimesViews[i].addEventListener('dragover', popTimeDragOver);
        popTimesViews[i].addEventListener('dragleave', popTimeDragLeave);
        popTimesViews[i].addEventListener('drop', popTimeDrop);
        popTimesViews[i].addEventListener('mouseover', popTimeMouseOver);
        popTimesViews[i].addEventListener('mouseleave', popTimeMouseLeave);
    }
}

function restartMouseOver() {
    var popTimesElements = document.getElementsByClassName('popTime');
    for (var i in Object.getOwnPropertyNames(popTimesElements)) {
        setPopTimeViewState(popTimesElements[i], 'highlight');
    }
}

function restartMouseLeave() {
    var popTimesElements = document.getElementsByClassName('popTime');
    for (var i in Object.getOwnPropertyNames(popTimesElements)) {
        setPopTimeViewState(popTimesElements[i], 'start');
    }
}

function drawPopTimes() {
    var popTimesViews = document.getElementsByClassName("popTime");
    for (var i in Object.getOwnPropertyNames(popTimes)) {
        if (popTimes[i].time != 0) {
            popTimesViews[i].innerHTML = fullTimeFormat(popTimes[i].time);
        } else {
            popTimesViews[i].innerHTML = '';
        }
        popTimesViews[i].setAttribute(POP_TIME_DATA_ATTRIBUTE, popTimes[i].time);
        popTimesViews[i].setAttribute(POP_TIME_INDEX, i);

    }
}

window.onkeydown = function (event) {
    if (event.keyCode >= 112 && event.keyCode <= 123) {

    } else {
        event.preventDefault();
    }
    if (!document.activeElement.classList.contains('timeInput')) {
        document.getElementsByClassName("timeInput")[0].focus();
    }
    if (event.keyCode >= 48 && event.keyCode <= 57) {
        pressNum(event.keyCode);
        event.preventDefault();
    } else if (event.keyCode == 32) {
        pressNum(48)
    } else if (event.keyCode == 8) {
        // decrementTimeCursorPosition();
        pressNum(48);
        decrementTimeCursorPosition();
        decrementTimeCursorPosition();
    } else if (event.keyCode == 13) {
        startStop();
    } else if (event.keyCode == 37) {
        decrementTimeCursorPosition();
    } else if (event.keyCode == 39) {
        incrementTimeCursorPosition();
    }
};

function decrementTimeCursorPosition() {
    if (timeCursorPosition > 0) {
        setTimeCursorPosition(timeCursorPosition - 1);
    }
}

function incrementTimeCursorPosition() {
    if (timeCursorPosition < NUM_SIZE * NUMBER_OF_TIME_INPUTS - 1) {
        setTimeCursorPosition(timeCursorPosition + 1);
    }
}

function setTimeCursorPosition(newTimeCursorPosition) {
    setTimeInputViewState(timeInputMap[timeCursorPosition], 'enabled');
    timeCursorPosition = newTimeCursorPosition;
    setTimeInputViewState(timeInputMap[timeCursorPosition], 'active');
    // timeInputMap[timeCursorPosition].focus();

    // document.activeElement.setSelectionRange();
    // var positionInInput = timeCursorPosition < NUM_SIZE * NUMBER_OF_TIME_INPUTS ? timeCursorPosition % NUM_SIZE : NUM_SIZE;
    // timeInputMap[timeCursorPosition].setSelectionRange(positionInInput, positionInInput);

}

function popTimeClick(e) {
    var element = e.target;
    while (element.getAttribute('class') === null || !element.getAttribute('class').includes('popTime')) {
        element = element.parentElement;
    }
    stopRing();
    stop();
    setViewTime(element.getAttribute(POP_TIME_DATA_ATTRIBUTE));
    start();
    // } else {
    //     return false;
    // }
}

window.onclick = function (ev) {
    if (mode == 'ringing') {
        stopRing();
    }
    // setTimeCursorPosition(timeCursorPosition);
};

function onNumClick(event) {
    event.preventDefault();
}

function pressNum(keyCode) {
    // if (document.activeElement.selectionStart == 2 && document.activeElement.next != null) {
    //     document.activeElement.next.focus();
    //     document.activeElement.setSelectionRange(0, 0);
    // }
    // var text = document.activeElement.value;
    // text[document.activeElement.selectionStart] = keyCode - 48;
    if (timeCursorPosition < NUM_SIZE * NUMBER_OF_TIME_INPUTS) {
        // var newSelectionStart = input.selectionStart + 1;
        timeInputMap[timeCursorPosition].innerText = keyCode - 48;
        /* if (newSelectionStart == NUM_SIZE && document.activeElement.next != null) {
             document.activeElement.next.focus();
             document.activeElement.setSelectionRange(0, 0);
         } */
        /*else {
                input.setSelectionRange(newSelectionStart, newSelectionStart);
            }*/
        incrementTimeCursorPosition();
        timeToCountInSeconds = parseTimeView();
        // if (timeToCountInSeconds > 0) {
            setStartStopViewState(document.getElementsByClassName("startStop")[0], 'start');
        // } else {
        //     setStartStopViewState(document.getElementsByClassName("startStop")[0], 'nostart');
        // }
        lastTimer = timeToCountInSeconds;
        drawRestartTime(timeToCountInSeconds);
    }
}

function setStartStopViewState(view, state) {
    view.classList.remove('start');
    // view.classList.remove('nostart');
    view.classList.add(state);
}

function setCharAt(str, index, chr) {
    if (index > str.length - 1) return str;
    return str.substr(0, index) + chr + str.substr(index + 1);
}

function startStop() {
    if (mode == 'ringing') {
        stopRing();
    } else if (mode == 'running') {
        stop();
    } else {
        start();
    }
}

function stopRing() {
    ring.pause();
    ring.currentTime = 0;
    setViewTime(lastTimer);
    stop();
}

function start() {
    timeToCountInSeconds = parseTimeView();
    history.pushState(null, "", formatTimeToUrl(timeToCountInSeconds));
    lastTimer = timeToCountInSeconds;
    drawRestartTime(lastTimer);
    if (timeToCountInSeconds > 0) {
        setRestartViewState(document.getElementsByClassName('restart')[0], 'start');
        startTime = new Date().getTime();
        countedSeconds = 0;
        tickIntervalId = setInterval(onTick, 100);
        mode = 'running';
        setMode(mode);
        drawStartStop();
    }
}

function setRestartViewState(view, state) {
    view.classList.remove('start');
    view.classList.remove('stop');
    view.classList.remove('nostart');
    view.classList.add(state);
}

function parseTimeView() {
    var documents = document.getElementsByClassName("timeInput");
    return parseInt(documents[0].innerText.concat(documents[1].innerText)) * secondsInHour
        + parseInt(documents[2].innerText.concat(documents[3].innerText)) * 60
        + parseInt(documents[4].innerText.concat(documents[5].innerText));
}

// function setRestartView(time) {
//     dra(time);
// }

function fullTimeFormat(time) {
    var formattedTime = formatTime(time);
    return '<div>'
        + formattedTime.substr(0, 2) + '</div><div class="retryTimeUnitLabels">:</div>'
        + formattedTime.substr(2, 2) + '</div><div class="retryTimeUnitLabels">:</div>'
        + formattedTime.substr(4, 2)
        // + '</div><div class="retryTimeUnitLabels">:</div>'
        ;
}

function popTimeOnContextMenu(event) {
    event.preventDefault();
}

function stop() {
    // if (tickIntervalId != null) {
    //     mode = 'stopped';
    //     setMode(mode);
    //     drawStartStop();
    // }
    setTimeCursorPosition(0);
    mode = 'stopped';
    setMode(mode);
    clearInterval(tickIntervalId);
    tickIntervalId = null;
    drawStartStop();
    setTimeCursorPosition(timeCursorPosition);
}

function onTick() {
    var currentTime = new Date().getTime();
    if ((currentTime - startTime) / 1000 > countedSeconds + 1) {
        countedSeconds = Math.floor((currentTime - startTime) / 1000);
        timeLeft = Math.max(timeToCountInSeconds - countedSeconds, 0);
        setViewTime(timeLeft);
        if (timeLeft == 0) {
            startRing();
            // notify();
        }
    }
}

function startRing() {
    mode = 'ringing';
    clearInterval(tickIntervalId);
    countedSeconds = null;
    tickIntervalId = null;
    setTimeout(function () {
        stopRing();
    }, 24000);
    ring.play();
    drawStartStop();
}

function setViewTime(time) {
    var timeString = formatTime(time);
    var inputs = document.getElementsByClassName("timeInput");
    for (var i = 0; i < NUMBER_OF_TIME_INPUTS; i++) {
        inputs[i].innerText = timeString.substr(i, 1);
    }
    // inputs[0].value = timeString.substr(0, 2);
    // inputs[1].value = timeString.substr(2, 2);
    // inputs[2].value = timeString.substr(4, 2);
}

function formatTime(time) {
    var hour = Math.floor(time / secondsInHour);
    var minutes = Math.floor((time - hour * secondsInHour) / 60);
    var seconds = Math.floor((time - hour * secondsInHour - minutes * 60));
    return formatNumberLength(hour, 2).concat(formatNumberLength(minutes, 2), formatNumberLength(seconds, 2));
}

function formatTimeToUrl(time) {
    var hour = Math.floor(time / secondsInHour);
    var minutes = Math.floor((time - hour * secondsInHour) / 60);
    var seconds = Math.floor((time - hour * secondsInHour - minutes * 60));
    var result;
    // return hour.toString() + 'hours-' + minutes.toString() + 'minutes' + seconds.toString() + 'seconds';
    return 'index.html?' + hour.toString() + 'hours-' + minutes.toString() + 'minutes-' + seconds.toString() + 'seconds';
}

function formatNumberLength(num, length) {
    var r = "" + num;
    while (r.length < length) {
        r = "0" + r;
    }
    return r;
}


function notify() {

    if (Notification.permission === "granted") {
        // If it's okay let's create a notification
        var notification = new Notification("times up!");
    }

// Otherwise, we need to ask the user for permission
    else if (Notification.permission !== "denied") {
        Notification.requestPermission(function (permission) {
            // If the user accepts, let's create a notification
            if (permission === "granted") {
                var notification = new Notification("times up!");
            }
        });
    }
}

function drawStartStop() {
    var startStopDiv = document.getElementsByClassName("startStop")[0];
    if (mode == 'ringing') {
        setRestartViewState(startStopDiv, 'stop');
        startStopDiv.children[0].innerText = 'STOP';
    } else if (mode == 'stopped') {
        // if (timeToCountInSeconds - countedSeconds > 0) {
            setRestartViewState(startStopDiv, 'start');
            startStopDiv.children[0].innerText = 'START';
        // } else {
        //     setRestartViewState(startStopDiv, 'nostart');
        // }
    } else if (mode == 'running') {
        setRestartViewState(startStopDiv, 'stop');
        startStopDiv.children[0].innerText = 'PAUSE';
    }
}

function setMode(mode) {
    var popTimes = document.getElementsByClassName("popTime");
    var time = document.getElementsByClassName("time")[0];
    var inputs = document.getElementsByClassName("timeInput");
    var buttons = document.getElementsByClassName("numButton");
    var cssClass = mode == 'stopped' ? 'start' : 'stop';
    for (var j in Object.getOwnPropertyNames(popTimes)) {
        setPopTimeViewState(popTimes[j], cssClass);
    }
    for (var l in Object.getOwnPropertyNames(inputs)) {
        // if (inputs[l].classList.contains('timeInput')) {
        //     inputs[l].disabled = mode == 'stopped' ? false : true;
            setTimeInputViewState(inputs[l], mode == 'stopped' ? 'enabled' : 'disabled');
        // }
    }
    for (var m in buttons) {
        if (buttons[m].nodeName == 'DIV') {
            setNumViewState(buttons[m], cssClass);
        }
    }
    time.setAttribute('class', 'time ' + cssClass);
}

function setTimeInputViewState(view, state) {
    view.classList.remove('enabled');
    view.classList.remove('disabled');
    view.classList.remove('active');
    view.classList.add(state);
}

function setNumViewState(view, state) {
    view.classList.remove('start');
    view.classList.remove('stop');
    view.classList.add(state);
}

function restart() {
    if (lastTimer > 0) {
        setViewTime(lastTimer);
        stopRing();
        stop();
        start();
    }
}

function dragTimeMouseDown(e) {
    var element = e.target;
    while (element.getAttribute('class') === null || !element.getAttribute('class').includes('restart')) {
        element = element.parentElement;
    }
}

function drawRestartTime(time) {
    localStorage.setItem('restartTime', time.toString());
    document.getElementsByClassName("restartTime")[0].innerHTML = fullTimeFormat(time);
}

function dragTimeStart(ev) {
    var data = JSON.stringify({time: lastTimer, index: 0});
    ev.dataTransfer.setData("text/plain", data);
    dataTransfer = data;
    ev.dataTransfer.dropEffect = "copy";
    var element = ev.target;
    isPopTimeDrag = true;
    while (element.getAttribute('class') === null || !element.getAttribute('class').includes('restart')) {
        element = element.parentElement;
    }
    // element.setAttribute('class', 'restart drag');
}

function popTimeDragOver(e) {
    var element = e.target;
    while (element.getAttribute('class') === null || !element.getAttribute('class').includes('popTime')) {
        element = element.parentElement;
    }
    setPopTimeViewState(element, 'hover');
    event.preventDefault();
}

function popTimeDragLeave(e) {
    var element = e.target;
    while (element.getAttribute('class') === null || !element.getAttribute('class').includes('popTime')) {
        element = element.parentElement;
    }
    if (isPopTimeDrag) {
        setPopTimeViewState(element, 'highlight');
    } else {
        setPopTimeViewState(element, 'start');
    }
}

function popTimeDragEnd(e) {
    // if (dataTransfer != null) {
    //     var data = JSON.parse(dataTransfer);
    //     popTimes[data.index.toString()] = {time: 0, usage: 0};
    //     drawPopTimes();
    // }
}

function popTimeDrop(e) {
    dataTransfer = null;
    var data = JSON.parse(e.dataTransfer.getData("text/plain"));
    var element = e.target;
    while (element.getAttribute('class') === null || !element.getAttribute('class').includes('popTime')) {
        element = element.parentElement;
    }
    var i = element.getAttribute(POP_TIME_INDEX);
    localStorage.setItem(i.toString(), '{"time": "' + data.time.toString() + '", "usage":0}');
    popTimes[i.toString()] = {time: data.time, usage: 0};
    if (data.index != 0) {
        popTimes[data.index.toString()] = {time: element.getAttribute(POP_TIME_DATA_ATTRIBUTE), usage: 0};
    }
    drawPopTimes();
    setPopTimeViewState(element, 'start');
    restartDragRestore();
}

function dragTimeEnd() {
    restartDragRestore();
}

function restartDragRestore() {
    document.getElementsByClassName("restart")[0].setAttribute("class", "restart start");
}

function getParentWithClass(element, clazz) {
    var result = element;
    while (result.getAttribute('class') === null || !result.getAttribute('class').includes(clazz)) {
        result = result.parentElement;
    }
    return result;
}
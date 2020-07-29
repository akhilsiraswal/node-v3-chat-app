const socket = io();

// Elements
const $messageForm = document.querySelector("#message-form");
const $messageFormInput = $messageForm.querySelector("input");
const $messageFormButton = $messageForm.querySelector("button");
const $sendLocationButton = document.querySelector("#send-location");
const $messages = document.querySelector("#messages");

// Templates..
const messageTemplate = document.querySelector("#message-template").innerHTML;
const urlTemplate = document.querySelector("#url-template").innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;

// Options..
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

const autoscroll = () => {
  // New message element..

  const $newMessages = $messages.lastElementChild;

  // Height of the new message..
  const newMessageStyles = getComputedStyle($newMessages);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  const newMessageHeight = $newMessages.offsetHeight + newMessageMargin;

  // Visible height..

  const visibleHeight = $messages.offsetHeight;

  // Height of messages container..
  const containerHeight = $messages.scrollHeight;

  //How far have I scrolled??
  const scrollOffset = $messages.scrollTop + visibleHeight;

  if (containerHeight - newMessageHeight <= scrollOffset) {
    $messages.scrollTop = $messages.scrollHeight;
  }
};
// location Message rendering...

socket.on("message", (message) => {
  console.log(message);
  const html = Mustache.render(messageTemplate, {
    username: message.username,
    message: message.text,
    createdAt: moment(message.createdAt).format("h:mm:a"),
  });
  $messages.insertAdjacentHTML("beforeend", html);
  autoscroll();
});

socket.on("locationMessage", (url) => {
  // console.log(url.text);
  const html = Mustache.render(urlTemplate, {
    username: url.username,
    url: url.text,
    createdAt: moment(url.createdAt).format("h:mm:a"),
  });
  $messages.insertAdjacentHTML("beforeend", html);
  autoscroll();
});

socket.on("roomData", ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    users,
  });
  document.querySelector("#sidebar").innerHTML = html;
});
// Templates closed

$messageForm.addEventListener("submit", (e) => {
  e.preventDefault();

  $messageFormButton.setAttribute("disabled", "disabled");
  // disable..
  const message = e.target.elements.message.value;
  socket.emit("sendMessage", message, (error) => {
    $messageFormButton.removeAttribute("disable");
    $messageFormInput.value = "";
    $messageFormInput.focus();
    // enable..
    $messageFormButton.removeAttribute("disabled");

    if (error) {
      return console.log(error);
    }
    console.log("message delivered");
  });
});

$sendLocationButton.addEventListener("click", () => {
  //

  if (!navigator.geolocation) {
    return alert("Geolocation is not supported by your browser");
  }

  $sendLocationButton.setAttribute("disabled", "disabled");

  navigator.geolocation.getCurrentPosition((position) => {
    socket.emit(
      "sendLocation",
      {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      },
      () => {
        $sendLocationButton.removeAttribute("disabled");
        console.log("Location Shared!!");
      }
    );
  });
});

socket.emit("join", { username, room }, (error) => {
  if (error) {
    alert(error);
    location.href = "/";
  }
});

const socket = io();

// Elements
const $messageForm = document.querySelector("#message-form");
const $messageInput = $messageForm.querySelector("input");
const $messageBtn = $messageForm.querySelector("button");
const $locationBtn = document.querySelector("#send-location");
const $messages = document.querySelector("#messages");
const $sidebar = document.querySelector("#sidebar");

// Templates
const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationMessageTemplate = document.querySelector(
  "#location-message-template"
).innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;

// Option
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

// Autoscroll
const autoscroll = () => {
  const $newMessage = $messages.lastElementChild;
  const newMessageStyles = getComputedStyle($newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;
  const visibleHeight = $messages.offsetHeight;
  const containerHeight = $messages.scrollHeight;
  const scrollOffset = $messages.scrollTop + visibleHeight;

  if (containerHeight - newMessageHeight <= scrollOffset) {
    $messages.scrollTop = scrollHeight;
  }
};

// Message
$messageForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const msg = $messageInput.value;
  $messageBtn.setAttribute("disabled", "disabled");
  $messageInput.value = "";
  $messageInput.focus();

  socket.emit("sendMessage", msg, (message) => {
    $messageBtn.removeAttribute("disabled");
  });
});

socket.on("message", ({ text, createdAt, sender }) => {
  const html = Mustache.render(messageTemplate, {
    text,
    createdAt: dayjs(createdAt).format("h:mm a"),
    username: sender,
  });
  $messages.insertAdjacentHTML("beforeend", html);
  autoscroll();
});

// Location message
socket.on("locationMessage", ({ text, createdAt, sender }) => {
  const html = Mustache.render(locationMessageTemplate, {
    text,
    createdAt: dayjs(createdAt).format("h:mm a"),
    username: sender,
  });
  $messages.insertAdjacentHTML("beforeend", html);
  autoscroll();
});

$locationBtn.addEventListener("click", () => {
  if (!navigator.geolocation) {
    return alert("Geolocation is not supported by your browser");
  }
  $locationBtn.setAttribute("disabled", "disabled");

  navigator.geolocation.getCurrentPosition((position) => {
    socket.emit(
      "sendLocation",
      {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      },
      () => {
        $locationBtn.removeAttribute("disabled");
        console.log("Location shared");
      }
    );
  });
});

// Room data
socket.on("roomData", ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    users,
  });
  $sidebar.insertAdjacentHTML("beforeend", html);
});

// Join
socket.emit("join", { username, room }, (error) => {
  if (error) {
    alert(error);
    location.href = "/";
  }
});

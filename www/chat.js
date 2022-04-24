//Основные контейнеры
let chatContainer = document.getElementById('chat-id')
let groupsContainer = document.getElementById('groups-id');
let usersContainer = document.getElementById('users-id');
let profileContainer = document.getElementById('profile-id');

let chatMessageInput = document.getElementById('chat-message-input');
let chatMessageSubmit = document.getElementById('chat-message-submit');
let chatWindow = document.getElementById('chat-window');
let groupsWindow = document.getElementById('groups-window')

//Кнопки
let groupButton = document.getElementById('group-button');
let userButton = document.getElementById('user-button');
let chatButton = document.getElementById('chat-button');
let profileButton = document.getElementById('profile-button')

groupButton.onclick = function (e) {
    groupsContainer.hidden = false;
    chatContainer.hidden = true;
    usersContainer.hidden = true;
    profileContainer.hidden = true;
    updateGroups();
}

userButton.onclick = function (e) {
    groupsContainer.hidden = true;
    chatContainer.hidden = true;
    usersContainer.hidden = false;
    profileContainer.hidden = true;
}

chatButton.onclick = function (e) {
    groupsContainer.hidden = true;
    chatContainer.hidden = false;
    usersContainer.hidden = true;
    profileContainer.hidden = true;

    chatMessageInput.focus();
}

profileButton.onclick = function (e) {
    groupsContainer.hidden = true;
    chatContainer.hidden = true;
    usersContainer.hidden = true;
    profileContainer.hidden = false;
}


const roomName = 'lobby';

groupsContainer.hidden = true;
chatContainer.hidden = false;
usersContainer.hidden = true;
profileContainer.hidden = true;
chatMessageInput.focus();

chatMessageInput.onkeyup = function (e) {
    if (e.keyCode === 13) {
        chatMessageSubmit.click();
    }
}

chatMessageSubmit.onclick = function (e) {
    chatSocket.send(JSON.stringify({
        'message': chatMessageInput.value
    }));
    chatMessageInput.value = '';
};


function showMessage(message) {
    let div = document.createElement('div');
    div.className = "message";
    div.innerHTML = message;
    chatWindow.append(div);
}

let chatSocket = null;

function connect() {
    chatSocket = new WebSocket("ws://127.0.0.1:8000/ws/chat/" + roomName + "/");

    chatSocket.onopen = function (e) {
        console.log('Successfully connected to the WebSocket.')
    }


    chatSocket.onclose = function (e) {
        console.log('WebSocket connection closed unexpectedly. Trying to recconect...');
        setTimeout(function () {
            console.log("Reconnecting...");
            connect();
        }, 2000);
    }

    chatSocket.onmessage = function (e) {
        const data = JSON.parse(e.data);
        console.log(data);

        switch (data.type) {
            case "user_list":
                for (let i = 0; i < data.users.length; i++) {
                    onlineUsersSelectorAdd(data.users[i]);
                }
                break;
            case "user_join":
                showMessage(`${data.user} вошел в комнату.`);
                onlineUsersSelectorAdd(data.user);
                break;
            case "user_leave":
                showMessage(`${data.user} покинул комнату.`);
                onlineUsersSelectorRemove(data.user);
                break;
            case 'private_message':
                showMessage(`PM от ${data.user}: ${data.message}`);
                break;
            case 'private_message_delivered':
                showMessage(`PM ${data.target}: ${data.message}`);
                break;
            case "chat_message":
                showMessage(`${data.user}: ${data.message}`);
                break;
            default:
                console.error("Unknown message type!");
                break;
        }
    }
    chatSocket.onerror = function (err) {
        console.log("WebSocket encountered an error: " + err.message);
        console.log("Closing the socket.");
        chatSocket.close();
    }
}

//connect();

function updateGroups() {
    fetch('http://localhost:8000/chat/api/rooms/', {
        method: 'GET',
        headers: {
            accept: 'application/json',
        },
    })
        .then((response) => {
            return response.json();
        })
        .then((data) => {
            groupsWindow.innerHTML = '';
            for (let group in data) {
                let div = document.createElement('div');
                div.className = 'group';
                div.innerHTML = `${data[group].name}`;
                let btnEdit = document.createElement('button');
                btnEdit.className = 'group-edit-button';
                btnEdit.id = `group-edit-${data[group].id}`
                btnEdit.innerHTML = 'Редактировать';
                btnEdit.onclick = function (ev) {
                    editGroup(ev.target.id.split('-')[2]);
                }
                let btnDelete = document.createElement('button');
                btnDelete.className = 'group-delete-button';
                btnDelete.id = `group-delete-${data[group].id}`
                btnDelete.innerHTML = 'Удалить';
                btnDelete.onclick = function (ev) {
                    deleteGroup(ev.target.id.split('-')[2]);
                }
                div.append(btnDelete);
                div.append(btnEdit);

                groupsWindow.append(div);
            }
        })
        .catch(() => {
            console.log('error');
        });
}

function addGroup(groupName) {

}

function editGroup(groupId) {

}

function deleteGroup(groupId) {
    fetch(`http://localhost:8000/chat/api/rooms/${groupId}`, {
        method: 'DELETE',
        headers: {
            accept: 'application/json',
        },
    })
        .then((response) => {
            console.log(response);
        })
        .catch((error) => {
            console.log(error);
        });
}
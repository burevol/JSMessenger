//Основные контейнеры
let chatContainer = document.getElementById('chat-id')
let groupsContainer = document.getElementById('groups-id');
let usersContainer = document.getElementById('users-id');
let profileContainer = document.getElementById('profile-id');

let profileAvatarInput = document.getElementById('avatar-file-input');
let profileAvatarSubmit = document.getElementById('avatar-file-submit');
let profileAvatar = document.getElementById('avatar-id');
let profileInput = document.getElementById('create-profile-input');
let profileSubmit = document.getElementById('create-profile-submit');

let groupCreateInput = document.getElementById('create-group-input');
let groupCreateSubmit = document.getElementById('create-group-submit');

let chatMessageInput = document.getElementById('chat-message-input');
let chatMessageSubmit = document.getElementById('chat-message-submit');

let chatWindow = document.getElementById('chat-window');
let groupsWindow = document.getElementById('groups-window')

//Кнопки переключения разделов
let groupButton = document.getElementById('group-button');
let userButton = document.getElementById('user-button');
let chatButton = document.getElementById('chat-button');
let profileButton = document.getElementById('profile-button');

let currentGroupDiv = document.getElementById('current-group');

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
let userId = null;

groupsContainer.hidden = true;
chatContainer.hidden = false;
usersContainer.hidden = true;
profileContainer.hidden = true;
chatMessageInput.focus();

profileInput.onkeyup = function (e) {
    if (e.keyCode === 13) {
        profileSubmit.click();
    }
}

profileSubmit.onclick = function (e) {
    doLogin();
}

chatMessageInput.onkeyup = function (e) {
    if (e.keyCode === 13) {
        chatMessageSubmit.click();
    }
}

groupCreateInput.onkeyup = function (e) {
    if (e.keyCode === 13) {
        groupCreateSubmit.click();
    }
}

chatMessageSubmit.onclick = function (e) {
    chatSocket.send(JSON.stringify({
        'command': 'message',
        'message': chatMessageInput.value
    }));
    chatMessageInput.value = '';
};

groupCreateSubmit.onclick = function (e) {
    addGroup(groupCreateInput.value);
    groupCreateInput.value = '';
}

profileAvatarSubmit.onclick = function (e) {
    if (userId != null) {
        let data = new FormData();

        data.append('avatar', profileAvatarInput.files[0]);
        fetch(`http://localhost:8000/chat/api/profiles/${userId}/`, {
            method: 'PUT',
            body: data
        }).then(response => {
            return response.json();
        }).then(data => {
            updateAvatar();
        }).catch((error) => {
            console.error('Error:', error);
        });

    }
}

function showMessage(message, mainMessage=false) {
    let div = document.createElement('div');
    if (mainMessage) {
        div.className = 'main-message';
    } else {
        div.className = "message";
    }
    div.innerHTML = message;
    chatWindow.append(div);
}

let chatSocket = null;

function connect() {
    chatSocket = new WebSocket("ws://127.0.0.1:8000/ws/chat/");

    chatSocket.onopen = function (e) {
        chatSocket.send(JSON.stringify({
            'command': 'auth',
            'message': userId
        }));
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
        let mainMessage = false;
        switch (data.type) {
            case "user_list":
                for (let i = 0; i < data.users.length; i++) {
                    onlineUsersSelectorAdd(data.users[i]);
                }
                break;
            case "user_join":
                showMessage(`${data.user} вошел в комнату.`);
                break;
            case "user_leave":
                showMessage(`${data.user} покинул комнату.`);
                break;
            case 'private_message':
                showMessage(`PM от ${data.user}: ${data.message}`);
                break;
            case 'private_message_delivered':
                showMessage(`PM ${data.target}: ${data.message}`);
                break;
            case "chat_message":
                if (data.user == profileInput.value) {
                    mainMessage = true;
                } else {
                    mainMessage = false
                }
                showMessage(`${data.user}: ${data.message}`, mainMessage);
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
                let groupName = document.createElement('div');
                groupName.id = `group-name-${data[group].id}`;
                groupName.innerHTML = `${data[group].name}`;
                groupName.className = 'group-name';
                let btnConnect = document.createElement('button');
                btnConnect.innerHTML = 'Connect';
                btnConnect.className = 'group-connect-button'
                btnConnect.onclick = function (ev) {
                    chatSocket.send(JSON.stringify({
                        'command': 'enter_room',
                        'message': groupName.innerHTML
                    }));
                    currentGroupDiv.innerHTML = `Текущая группа: ${groupName.innerHTML}`
                }
                let btnOK = document.createElement('button');
                btnOK.id = `group-okbt-${data[group].id}`;
                btnOK.innerHTML = 'ОК';
                btnOK.onclick = function (ev) {
                    const groupId = ev.target.id.split('-')[2];
                    let groupName = document.getElementById('group-name-' + groupId);
                    let groupInput = document.getElementById('group-edit-' + groupId);
                    let bntEdit = document.getElementById('group-editbt-' + groupId);
                    let btOk = document.getElementById('group-okbt-' + groupId);
                    groupName.hidden = false;
                    groupInput.hidden = true;
                    bntEdit.hidden = false;
                    btOk.hidden = true;
                    editGroup(groupId, groupInput.value);
                }
                btnOK.hidden = true;
                let btnEdit = document.createElement('button');
                btnEdit.className = 'group-edit-button';
                btnEdit.id = `group-editbt-${data[group].id}`
                btnEdit.innerHTML = 'Edit';
                btnEdit.onclick = function (ev) {
                    const groupId = ev.target.id.split('-')[2];
                    let groupName = document.getElementById('group-name-' + groupId);
                    let groupInput = document.getElementById('group-edit-' + groupId);
                    let bntEdit = document.getElementById('group-editbt-' + groupId);
                    let btOk = document.getElementById('group-okbt-' + groupId);
                    groupName.hidden = true;
                    groupInput.hidden = false;
                    groupInput.value = groupName.innerHTML;
                    bntEdit.hidden = true;
                    btOk.hidden = false;
                }
                let groupEdit = document.createElement('input');
                groupEdit.type = 'text';
                groupEdit.hidden = true;
                groupEdit.id = `group-edit-${data[group].id}`;
                let btnDelete = document.createElement('button');
                btnDelete.className = 'group-delete-button';
                btnDelete.id = `group-delete-${data[group].id}`
                btnDelete.innerHTML = 'Delete';
                btnDelete.onclick = function (ev) {
                    deleteGroup(ev.target.id.split('-')[2]);
                }
                div.append(groupName);
                div.append(groupEdit);
                div.append(btnDelete);

                div.append(btnOK);
                div.append(btnEdit);
                div.append(btnConnect);

                groupsWindow.append(div);
            }
        })
        .catch(() => {
            console.log('error');
        });
}

function addGroup(groupName) {
    if (groupName != "") {
        console.log(JSON.stringify({name: groupName}))
        fetch('http://localhost:8000/chat/api/rooms/', {
            method: 'POST',
            body: JSON.stringify({name: groupName}),
            headers: {
                'Content-Type': 'application/json'
            }
        })
            .catch((error) => {
                console.log(error);
            });
    }
}

function editGroup(groupId, groupName) {
    fetch(`http://localhost:8000/chat/api/rooms/${groupId}/`, {
        method: 'PUT',
        body: JSON.stringify({name: groupName}),
        headers: {
            'Content-Type': 'application/json',
        },
    })
        .then((response) => {
            console.log(response);
        })
        .catch((error) => {
            console.log(error);
        });
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

function updateAvatar() {
    if (userId != null) {
        fetch(`http://localhost:8000/chat/api/profiles/${userId}/`, {
            method: 'GET',
            headers: {
                accept: 'application/json',
            },
        })
            .then((response) => {
                return response.json();
            })
            .then((data) => {
                console.log(data);

                let avatarImg = document.createElement('img');
                avatarImg.src = data.avatar;
                avatarImg.alt = 'Аватар';
                avatarImg.id = 'avatar-img';
                profileAvatar.innerHTML = '';
                profileAvatar.append(avatarImg);

            })
            .catch((error) => {
                console.log(error);
            });
    }
}

function doLogin() {
    fetch(`http://localhost:8000/chat/api/profiles/?username=${profileInput.value}`, {
        method: 'GET',
        headers: {
            accept: 'application/json',
        },
    })
        .then((response) => {
            return response.json();
        })
        .then((data) => {
                console.log(data.length)
                if (data.length === 0) {
                    fetch('http://localhost:8000/chat/api/profiles/', {
                        method: 'POST',
                        body: JSON.stringify({username: profileInput.value}),
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    })
                        .then((response) => {
                            return response.json();
                        })
                        .then((data) => {
                            userId = data.id;
                            updateAvatar();
                            connect();
                        })
                        .catch((error) => {
                            console.log(error);
                        });
                } else {
                    userId = data[0].id;
                    updateAvatar();
                    connect();
                }
            }
        )
        .catch(() => {
            console.log('error');
        });

}


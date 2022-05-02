//Основные контейнеры
let chatContainer = document.getElementById('chat-id')
let groupsContainer = document.getElementById('groups-id');
let usersContainer = document.getElementById('users-id');
let profileContainer = document.getElementById('profile-id');

//Блок аватара
let profileAvatarSubmit = document.getElementById('avatar-file-submit');
let profileAvatar = document.getElementById('avatar-id');
let profileAvatarInput = document.getElementById('avatar-file-input');

//Создание группы
let groupCreateInput = document.getElementById('create-group-input');
let groupCreateSubmit = document.getElementById('create-group-submit');

//Отправка сообщений
let chatMessageInput = document.getElementById('chat-message-input');
let chatMessageSubmit = document.getElementById('chat-message-submit');

//Окна внутри панелей
let chatWindow = document.getElementById('chat-window');
let groupsWindow = document.getElementById('groups-window');
let usersWindow = document.getElementById('users-window');

//Кнопки переключения разделов
let groupButton = document.getElementById('group-button');
let userButton = document.getElementById('user-button');
let chatButton = document.getElementById('chat-button');
let profileButton = document.getElementById('profile-button');

//Div с текущей группой
let currentGroupDiv = document.getElementById('current-group');

//Адрес сервера
let serverAddress = document.getElementById('server-address');


let buttonLoginMode = document.getElementById('login-mode');
let changeNameMode = document.getElementById('change-name-mode');

//divы для полей логин/пароль/имя пользователя
let divInputLogin = document.getElementById('input-login');
let divInputUsername = document.getElementById('username-login');
let divInputPassword = document.getElementById('password-login');

//Поля для авторизации
let inputLogin = document.getElementById('login-input');
let inputPassword = document.getElementById('password-input');
let inputUsername = document.getElementById('username-input');
let acceptLoginButton = document.getElementById('accept-login-button');

class ChatAPI {
    constructor(serverAddress, login, password) {
        this.serverAddress = serverAddress;
        this.login = login;
        this.password = password;
        this.username = null;
        this.userToken = null;
        this.profileId = null;
        this.userId = null;
        this.chatSocket = null;
        this.doLogin()
    }

    changeServerAddress(serverAddress) {
        this.serverAddress = serverAddress;
        this.doLogin();
    }

    changeUsernamePass(login, password) {
        this.login = login;
        this.password = password;
        this.doLogin();
    }

    doLogin() {
        fetch(`http://${serverAddress.value}/chat/api/auth-token/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "username": this.login,
                "password": this.password,
            })
        }).then(response => {
            return response.json();
        }).then(data => {
            // Получить данные профиля
            this.userToken = data.token;
            console.log('Logged in. Got the token.');
            fetch(`http://${this.serverAddress}/chat/api/profiles/?user__username=${this.login}`, {
                method: 'GET',
                headers: {
                    accept: 'application/json',
                    'Authorization': `Token ${this.userToken}`
                },
            }).then((response) => {
                return response.json();
            }).then((data) => {
                    this.profileId = data[0].id;
                    this.userId = data[0].user.id;
                    this.refreshAvatar();
                    this.getUsername()
                    this.connect();
                }
            ).catch((error) => {
                console.error('Error:', error);
            });
        }).catch((error) => {
            console.error('Error:', error);
        });
    }

    getUsername() {
        fetch(`http://${this.serverAddress}/chat/api/profiles/${this.profileId}/`, {
            method: 'GET',
            headers: {
                accept: 'application/json',
                'Authorization': `Token ${this.userToken}`
            },
        }).then((response) => {
            return response.json();
        }).then((data) => {
                this.username = data.user.first_name;
                inputUsername.value = this.username;
            }
        ).catch((error) => {
            console.error('Error:', error);
        });
    }

    updateUsername(newUsername) {
        fetch(`http://${this.serverAddress}/chat/api/users/${this.userId}/`, {
            method: 'PATCH',
            body: JSON.stringify({first_name: newUsername}),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Token ${this.userToken}`
            },
        }).then(() => {
            this.username = newUsername;
            inputUsername.value = this.username;
            this.chatSocket.send(JSON.stringify({
                'command': 'change_username',
                'message': this.username
            }))
        }).catch((error) => {
            console.error('Error:', error);
        });
    }

    addGroup(groupName) {
        if (groupName !== "") {
            fetch(`http://${this.serverAddress}/chat/api/rooms/`, {
                method: 'POST',
                body: JSON.stringify({name: groupName}),
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${this.userToken}`
                }
            }).catch((error) => {
                console.log(error);
            });
        }
    }

    editGroup(groupId, groupName) {
        fetch(`http://${this.serverAddress}/chat/api/rooms/${groupId}/`, {
            method: 'PUT',
            body: JSON.stringify({name: groupName}),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Token ${this.userToken}`
            },
        }).catch((error) => {
            console.log(error);
        });
    }

    deleteGroup(groupId) {
        fetch(`http://${this.serverAddress}/chat/api/rooms/${groupId}`, {
            method: 'DELETE',
            headers: {
                accept: 'application/json',
                'Authorization': `Token ${this.userToken}`
            },
        }).catch((error) => {
            console.log(error);
        });
    }

    updateAvatar(file) {
        let data = new FormData();
        data.append('avatar', file);
        fetch(`http://${this.serverAddress}/chat/api/profiles/${this.profileId}/`, {
            method: 'PATCH',
            body: data,
            headers: {
                accept: 'application/json',
                'Authorization': `Token ${this.userToken}`
            },
        }).then(response => {
            return response.json();
        }).then(() => {
            this.refreshAvatar();
        }).catch((error) => {
            console.error('Error:', error);
        });
    }

    refreshAvatar() {
        fetch(`http://${this.serverAddress}/chat/api/profiles/${this.profileId}/`, {
            method: 'GET',
            headers: {
                accept: 'application/json',
                'Authorization': `Token ${this.userToken}`
            },
        }).then((response) => {
            return response.json();
        }).then((data) => {
                let avatarImg = document.createElement('img');
                avatarImg.src = data.avatar;
                avatarImg.alt = 'Аватар';
                avatarImg.id = 'avatar-img';
                profileAvatar.innerHTML = '';
                profileAvatar.append(avatarImg);
            }
        ).catch((error) => {
            console.error('Error:', error);
        });
    }

    updateGroups() {
        fetch(`http://${this.serverAddress}/chat/api/rooms/`, {
            method: 'GET',
            headers: {
                accept: 'application/json',
                'Authorization': `Token ${this.userToken}`
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
                    btnConnect.className = 'group-connect-button buttons'
                    btnConnect.onclick = function () {
                        chatObject.chatSocket.send(JSON.stringify({
                            'command': 'enter_room',
                            'message': groupName.innerHTML
                        }));
                        currentGroupDiv.innerHTML = `Текущая группа: ${groupName.innerHTML}`
                    }
                    let btnOK = document.createElement('button');
                    btnOK.id = `group-okbt-${data[group].id}`;
                    btnOK.className = "buttons";
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
                        chatObject.editGroup(groupId, groupInput.value);
                    }
                    btnOK.hidden = true;
                    let btnEdit = document.createElement('button');
                    btnEdit.className = 'group-edit-button buttons';
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
                    btnDelete.className = 'group-delete-button buttons';
                    btnDelete.id = `group-delete-${data[group].id}`
                    btnDelete.innerHTML = 'Delete';
                    btnDelete.onclick = function (ev) {
                        chatObject.deleteGroup(ev.target.id.split('-')[2]);
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

    updateUsers() {
        fetch(`http://${this.serverAddress}/chat/api/profiles/`, {
            method: 'GET',
            headers: {
                accept: 'application/json',
                'Authorization': `Token ${this.userToken}`
            },
        })
            .then((response) => {
                return response.json();
            })
            .then((data) => {
                console.log(data);
                usersWindow.innerHTML = '';
                for (let user in data) {
                    let div = document.createElement('div');
                    div.className = 'group';
                    let userName = document.createElement('div');
                    userName.id = `user-name-${data[user].user.id}`;
                    userName.innerHTML = `${data[user].user.first_name}`;
                    userName.className = 'group-name';
                    let btnConnect = document.createElement('button');
                    btnConnect.innerHTML = 'Connect';
                    btnConnect.className = 'user-connect-button buttons'
                    btnConnect.onclick = function () {
                        chatObject.chatSocket.send(JSON.stringify({
                            'command': 'enter_private',
                            'message': userName.innerHTML
                        }))
                        currentGroupDiv.innerHTML = `Текущий приватный чат: ${userName.innerHTML}`;

                    }
                    div.append(userName);
                    div.append(btnConnect);
                    usersWindow.append(div);

                }
            })
            .catch(() => {
                console.log('error');

            });
    }

    connect() {
        this.chatSocket = new WebSocket(`ws://${this.serverAddress}/ws/chat/?token=${this.userToken}`);

        this.chatSocket.onopen = function () {
            console.log('Successfully connected to the WebSocket.')
        }

        this.chatSocket.onclose = function () {
            console.log('WebSocket connection closed unexpectedly. Trying to reconnect...');
            setTimeout(function () {
                console.log("Reconnecting...");
                chatObject.connect();
            }, 2000);
        }

        this.chatSocket.onmessage = function (e) {
            const data = JSON.parse(e.data);
            let mainMessage = false;
            switch (data.type) {
                case "update_profiles":
                    chatObject.updateUsers();
                    break;
                case "update_rooms":
                    chatObject.updateGroups();
                    break;
                case "user_join":
                    chatObject.showMessage(`${data.user} вошел в комнату.`);
                    break;
                case "user_leave":
                    chatObject.showMessage(`${data.user} покинул комнату.`);
                    break;
                case "chat_message":
                    mainMessage = data.user === chatObject.username;
                    chatObject.showMessage(`${data.user}: ${data.message}`, mainMessage);
                    break;
                default:
                    console.error("Unknown message type!");
                    break;
            }
        }
        this.chatSocket.onerror = function (err) {
            console.log("WebSocket encountered an error: " + err.message);
            console.log("Closing the socket.");
            chatObject.chatSocket.close();
        }
    }

    showMessage(message, mainMessage = false) {
        let div = document.createElement('div');
        if (mainMessage) {
            div.className = 'main-message';
        } else {
            div.className = "message";
        }
        div.innerHTML = message;
        chatWindow.append(div);
    }
}

serverAddress.value = '127.0.0.1:8000'
let chatObject = new ChatAPI(serverAddress.value, inputLogin.value, inputPassword.value);

let authMode = 'login';

setLoginVisible(authMode);

setPanelVisible('profile');

createHandlers();


function setLoginVisible(panel) {
    divInputLogin.hidden = true;
    divInputUsername.hidden = true;
    divInputPassword.hidden = true;

    authMode = panel;

    switch (panel) {
        case 'login':
            divInputLogin.hidden = false;
            divInputPassword.hidden = false;
            break;
        case 'change-name':
            divInputUsername.hidden = false;
            break;
    }

}

function

setPanelVisible(panel) {

    groupsContainer.hidden = true;
    chatContainer.hidden = true;
    usersContainer.hidden = true;
    profileContainer.hidden = true;

    switch (panel) {
        case "groups":
            groupsContainer.hidden = false;
            chatObject.updateGroups();
            break;
        case "users":
            usersContainer.hidden = false;
            chatObject.updateUsers();
            break;
        case "chat":
            chatContainer.hidden = false;
            chatMessageInput.focus();
            break;
        case "profile":
            profileContainer.hidden = false;
            break;
    }
}

function createHandlers() {
    serverAddress.onclick = function () {
        chatObject.changeServerAddress(serverAddress);
    }

    groupButton.onclick = function () {
        setPanelVisible("groups")
    }

    userButton.onclick = function () {
        setPanelVisible('users')
    }

    chatButton.onclick = function () {
        setPanelVisible('chat')
    }

    profileButton.onclick = function () {
        setPanelVisible('profile')
    }

    chatMessageInput.onkeyup = function (e) {
        if (e.key === "Enter") {
            chatMessageSubmit.click();
        }
    }

    groupCreateInput.onkeyup = function (e) {
        if (e.key === "Enter") {
            groupCreateSubmit.click();
        }
    }

    chatMessageSubmit.onclick = function () {
        chatObject.chatSocket.send(JSON.stringify({
            'command': 'message',
            'message': chatMessageInput.value
        }));
        chatMessageInput.value = '';
    };

    groupCreateSubmit.onclick = function () {
        chatObject.addGroup(groupCreateInput.value);
        groupCreateInput.value = '';
    }

    buttonLoginMode.onclick = function () {
        setLoginVisible('login');
    }

    changeNameMode.onclick = function () {
        setLoginVisible('change-name');
    }

    profileAvatarSubmit.onclick = function () {
        if (chatObject.profileId != null) {
            chatObject.updateAvatar(profileAvatarInput.files[0]);
        }
    }

    inputPassword.onkeyup = function (e) {
        if ((e.key === "Enter") && (authMode === 'login')) {
            chatObject.changeUsernamePass(inputLogin.value, inputPassword.value);
        }
    }

    inputUsername.onkeyup = function (e) {
        if ((e.key === "Enter") && (authMode === 'change-name')) {
            chatObject.updateUsername(inputUsername.value);
        }
    }

    acceptLoginButton.onclick = function () {
        switch (authMode) {
            case 'login':
                chatObject.changeUsernamePass(inputLogin.value, inputPassword.value);
                break;
            case 'change-name':
                chatObject.updateUsername(inputUsername.value);
                break;
        }
    }
}


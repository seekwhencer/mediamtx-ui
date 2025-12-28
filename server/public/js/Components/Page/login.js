export default class LoginComponent {
    constructor(page) {
        this.label = this.constructor.name.toUpperCase();
        this.page = page;
        this.auth = this.page.auth;
        this.csrfToken = this.auth.csrfToken;
    }

    render() {
        this.element = document.createElement('div');
        this.element.className = 'login';

        const loginBlock = document.createElement('div');
        loginBlock.className = 'login-block';

        const inputBlock = document.createElement('div');
        inputBlock.className = 'input-block';

        const title = document.createElement('h2');
        title.textContent = 'Login';
        inputBlock.appendChild(title);

        const usernameLabel = document.createElement('label');
        usernameLabel.textContent = 'Username';
        inputBlock.appendChild(usernameLabel);

        this.usernameInput = document.createElement('input');
        this.usernameInput.type = 'text';
        inputBlock.appendChild(this.usernameInput);

        const passwordLabel = document.createElement('label');
        passwordLabel.textContent = 'Password';
        inputBlock.appendChild(passwordLabel);

        this.passwordInput = document.createElement('input');
        this.passwordInput.type = 'password';
        inputBlock.appendChild(this.passwordInput);

        this.messageElement = document.createElement('div');
        this.messageElement.className = 'message';
        inputBlock.appendChild(this.messageElement);

        const loginButton = document.createElement('button');
        loginButton.textContent = 'Login';
        loginButton.addEventListener('click', async () => this.login());
        inputBlock.appendChild(loginButton);

        // append input block to login block
        loginBlock.appendChild(inputBlock);

        const messageBlock = document.createElement('div');
        messageBlock.className = 'message-block';
        messageBlock.innerHTML = 'Welcome<br />';
        messageBlock.innerHTML += this.page.icons.svg['message-circle-question-mark'];
        messageBlock.innerHTML += '<br />';
        messageBlock.innerHTML += 'This application requires authentication.<br />Please enter your credentials to continue.';

        loginBlock.appendChild(messageBlock);

        const footerElement = document.createElement('div');
        footerElement.className = 'footer';
        footerElement.innerHTML = 'mediaMTX user interface © 2026 Matthias Kallenbach | <a href="https://github.com/seekwhencer/mediamtx-ui" target="_blank">github</a>';
        loginBlock.appendChild(footerElement);

        // append login block to main element
        this.element.appendChild(loginBlock);

        document.querySelector('body').appendChild(this.element);
    }

    async login() {
        const username = this.usernameInput.value;
        const password = this.passwordInput.value;
        await this.auth.login(username, password);

        if (this.auth.isAuthenticated) {
            this.element.remove();
            this.page.create();
        } else {
            this.messageElement.innerHTML = 'Login failed.<br /> Please check your credentials.';
        }
    }

    destroy() {
        this.element.remove();
    };
}
export default class LoginComponent {
    constructor(page) {
        this.label = this.constructor.name.toUpperCase();
        this.page = page;
        this.auth = this.page.auth;
        this.csrfToken = this.auth.csrfToken;
    }

    render() {
        this.destroy();

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

        this.loginButton = document.createElement('button');
        this.loginButton.textContent = 'Login';
        this.loginButton.addEventListener('click', async () => this.login());
        inputBlock.appendChild(this.loginButton);

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

        const logoElement = document.createElement('div');
        logoElement.className = 'logo';
        logoElement.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" id="Layer_1" x="0" y="0" version="1.1" viewBox="0 0 800.5 246"><style>.st1{fill:#3dbde0}</style><path d="M0 171.2V74.6h35.4c2.7 9.7 5.5 19.4 8.2 29.3s5.4 19.7 8 29.3c2.6-9.7 5.3-19.4 8-29.3s5.4-19.7 8-29.3h35.1q.15 23.85.3 48.3c.15 24.45.2 32.4.3 48.3h-24v-65.4c-2.8 10.8-14.5 54.7-17.3 65.5H40.4c-2.8-10.6-14.2-53.7-17-64.3v64.4H11.8c-3.9 0-7.9-.2-11.8-.2m121.8 0V74.6h58v22.2H144v14.5h31.9v20.5H144V149h35.8v22.2zm75 0V74.6h34.4c7 0 13.4 1.2 19.3 3.6q8.85 3.6 15.3 10.2c4.4 4.4 7.7 9.4 10.2 15.3 2.4 5.8 3.6 12.2 3.6 19.1q0 10.35-3.6 19.2c-3.6 8.85-5.8 11-10.2 15.4q-6.6 6.6-15.3 10.2c-5.9 2.4-12.3 3.6-19.3 3.6zm34.4-74.1h-9.5v51.6h9.5c4.7 0 8.8-1.1 12.4-3.4q5.25-3.45 8.1-9.3c1.9-3.9 2.8-8.4 2.8-13.3s-.9-9.3-2.8-13.2-4.6-6.9-8.1-9.2c-3.6-2.1-7.7-3.2-12.4-3.2m62.7 74.1V74.6h24.9v96.6zm85-96.6h-20.5c-4.9 15.9-9.9 32-14.8 48.3-5 16.3-9.9 32.4-14.8 48.3h25c.9-3 1.8-6.1 2.7-9.2s1.8-6.1 2.7-9.2h32.6c.9 3 1.8 6.1 2.7 9.2s1.8 6.1 2.7 9.2h12zm-3.5 57.1h-10c1.6-5.6 3.3-11.2 5-16.9s3.4-11.3 5-16.9c1.6 5.6 3.3 11.2 5 16.9s3.4 11.3 5 16.9zm43.7 39.5h10.8c-4.9-15.9-24.8-80.7-29.7-96.6h-11.3z" style="fill:#1a65b7"/><path d="M445.7 171.2V74.6h35.4c2.7 9.7 5.5 19.4 8.2 29.3s5.4 19.7 8 29.3c2.6-9.7 5.3-19.4 8-29.3s5.4-19.7 8-29.3h35.1q.15 23.85.3 48.3c.15 24.45.2 32.4.3 48.3h-24v-65.5c-2.8 10.8-14.5 54.7-17.3 65.5h-21.6c-2.8-10.6-14.2-53.7-17-64.3v64.3zm138.7 0v-74h-21.8V74.6H631v22.6h-21.7v74zm136.5 0h13.6c-4.8-8.2-9.7-16.6-14.7-25s-9.9-16.8-14.7-25c4.6-7.7 9.3-15.4 14-23.3s9.3-15.6 14-23.3h-27.6c-2.7 4.5-5.3 9-8 13.6s-5.3 9.1-8 13.6c-2.7-4.4-5.3-9-8-13.6s-5.3-9.1-8-13.6h-13zm-70.8-96.6h-12.3c4.6 7.8 9.3 15.6 13.9 23.5s9.3 15.7 13.9 23.5c-4.9 8.1-9.9 16.4-14.8 24.8-5 8.4-9.9 16.6-14.8 24.8h27.6c2.9-5 5.9-10.1 8.9-15.1 3-5.1 5.9-10.1 8.9-15q4.2 7.35 8.7 15c2.9 5.1 5.8 10.1 8.7 15.1h11.7zM731.7 43l-4.2 8.9c13.7 7.8 23.3 21 26.4 36.3l9.5-2.3c-3.7-18.2-15.3-33.8-31.7-42.9m15.9-34-4.2 8.9c24 12.5 41.2 35.1 46.9 61.4l9.6-2.3c-6.3-29.3-25.5-54.3-52.3-68" class="st1"/><path d="m739.8 25.6-4.2 8.9c19.2 10.1 32.9 28 37.5 49l9.5-2.3c-5.2-23.9-20.9-44.2-42.8-55.6" class="st1"/></svg>';
        loginBlock.appendChild(logoElement);

        // append login block to main element
        this.element.appendChild(loginBlock);

        document.querySelector('body').appendChild(this.element);
    }

    async login() {
        this.loginButton.disabled = true;
        const username = this.usernameInput.value;
        const password = this.passwordInput.value;
        await this.auth.login(username, password);

        if (this.auth.isAuthenticated) {
            this.element.remove();
            this.page.create();
        } else {
            this.messageElement.innerHTML = 'Login failed.<br /> Please check your credentials.';
            this.loginButton.disabled = false;
        }
    }

    destroy() {
        this.element ? this.element.remove() : null;
    };
}
import Page from './page.js';

window.addEventListener("unhandledrejection", (event) => {
    event.preventDefault(); // This will not print the error in the console });

    console.log("Unhandled promise rejection");
    console.log(event.reason);
});

const page = window.PAGE = new Page();
page.create();


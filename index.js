const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const {Builder, By} = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const fs = require("fs");

const proxy = '45.192.143.114:5187';
const userAgent = 'Mozilla/5.0 (Windows CE) AppleWebKit/5352 (KHTML, like Gecko) Chrome/37.0.868.0 Mobile Safari/5352'
const options = new chrome.Options().addArguments(
    `user-agent=${userAgent}`
    // `--proxy-server=${proxy}`
);
const service = new chrome.ServiceBuilder('./chromedriver');

const driver = new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .setChromeService(service)
    .build();

const records = [];
const csvWriterHeaders = [
    {id: 'id', title: 'id'},
    {id: 'companyName', title: 'companyName'},
    {id: 'companyWebsite', title: 'companyWebsite'},
    {id: 'companyLinkedinUrl', title: 'companyLinkedinUrl'}
];

const delay = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms))
}

const randomDelay = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const getRandomInt = (min, max) => {
    min = Math.ceil(min) * 1000;
    max = Math.floor(max) * 1000;
    return (Math.floor(Math.random() * (max - min + 1)) + min);
}

const login = async () => {
    await driver.get('https://www.linkedin.com/checkpoint/rm/sign-in-another-account?fromSignIn=true&trk=guest_homepage-basic_nav-header-signin');
    const entryCredits = {
        email: 'login',
        password: 'password'
    }

    const email = await driver.findElement(By.id('username'));
    const password = await driver.findElement(By.id('password'));
    const submitButton = await driver.findElement(By.className('btn__primary--large'));

    await email.sendKeys(entryCredits.email);
    await password.sendKeys(entryCredits.password);
    await submitButton.click();
}

(async () => {
    const usersData = new Promise((resolve, reject) => {
        fs.readFile('users.txt', 'utf-8',
            (error, data) => {
                if (error) {
                    reject('Cannot get data');
                } else {
                    const dataArr = data.split('\n');
                    resolve(dataArr);
                }
            }
        );
    });

    await login();

    const users = await usersData;
    let counter = 1;

    const createCounter = () => {
        return () => {
            return counter++
        }
    }

    for (let i = 0; i < users.length; i++) {
        const id = createCounter()();
        await randomDelay(getRandomInt(13, 60));

        try {
            await userPage(users[i], id);
        } catch(e) {
            if (e) await userPage(users[i + 1], id)
        }
    }
})();

const userPage = async (userUrl, id) => {
    await driver.get(userUrl);
    await delay(1200);
    await parser(id);
}

const parser = async (id) => {
    const company = await driver.executeScript("document.getElementById('experience').scrollIntoView({block: 'start'})")
        .then(async () => {
            let companyName;
            let companyWebsite;

            await delay(1200);
            const companyLogo = await driver.findElement(By.css('a[data-field="experience_company_logo"]'));
            await companyLogo.click();
            await delay(1200);
            const companyLinkedinUrl = await driver.getCurrentUrl();

            try {
                await delay(1200);
                companyName = await driver.findElement(By.css('h1.ember-view')).getAttribute('title');
            } catch {
                companyName = 'empty'
            }

            try {
                const orgPageNavigation = await driver.findElements(By.css('a.org-page-navigation__item-anchor'));
                await orgPageNavigation[1].click();
                await delay(1200);
                companyWebsite = await driver.findElement(By.css('a.link-without-visited-state.ember-view > span')).getText()
            } catch {
                companyWebsite = 'empty'
            }

            return {
                id,
                companyName,
                companyWebsite,
                companyLinkedinUrl
            }
        });

    createResultFile(company);
}

const createResultFile = (record) => {
    const csvWriter = createCsvWriter({
        path: 'companies.csv',
        header: csvWriterHeaders
    });

    records.push(record);
    csvWriter.writeRecords(records).then(() => console.log('... Lucky hack ...'));
}
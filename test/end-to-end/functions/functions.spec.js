const { chromium } = require('@playwright/test');
const { test } = require('@playwright/test');
const TU = require('../shared/TestUtils');

const { notification } = require('../shared/components');
const FunctionPage = require('./functions.page');

test.beforeAll(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  TU.registerPage(page);
  await TU.login();
});

test.describe('Job Titles Management', () => {
  test.beforeEach(async () => {
    await TU.navigate('/#!/functions');
  });

  const page = new FunctionPage();

  const newProfession = 'Comptable';
  const updateProfession = 'Chef Comptable';

  test('successfully creates a new Function', async () => {
    await page.create(newProfession);
    await notification.hasSuccess();
  });

  test('successfully edits a Function', async () => {
    await page.update(newProfession, updateProfession);
    await notification.hasSuccess();
  });

  test('errors when missing function create when incorrect Function', async () => {
    await page.errorOnCreateFunction();
  });

  test('successfully delete a function', async () => {
    await page.remove(updateProfession);
    await notification.hasSuccess();
  });
});

const puppeteer = require('puppeteer');
const download = require('image-downloader');
const X2JS = require('x2js');
const fs = require('fs');
const vkbeautify = require('vkbeautify');
function convertJsonXML() {
  fs.readFile('data.json', (err, data) => {
    if (err) throw err;
    let listData = JSON.parse(data);
    var x2js = new X2JS();
    var document = x2js.js2xml({ root: listData });
    var dep = vkbeautify.xml(document, 4);
    console.log(dep);
    // console.log(listData);
    fs.writeFileSync('data.xml', dep);
  });
}
function extractItemsProduct() {
  const extractedElements = document.querySelectorAll(".product-card > .product-card__body > figure > .product-card__link-overlay");
  const items = [];
  const today = new Date();
  const yyyy = today.getFullYear();
  let mm = today.getMonth() + 1; // Months start at 0!
  let dd = today.getDate();

  if (dd < 10) dd = '0' + dd;
  if (mm < 10) mm = '0' + mm;

  const todayFormat = dd + '/' + mm + '/' + yyyy;
  const urlDetailProduct = "";
  for (let i = 0; i < extractedElements.length; i++) {
    // console.log(document.querySelectorAll(".product-card  .product-card__body > figure > .product-card__link-overlay"));
    let dataJson = {};
    dataJson.id = i < 10 ? "P00" + i : "P0" + i;
    dataJson.name = document.querySelectorAll(".product-card__title")[i].innerHTML;
    dataJson.description = document.querySelectorAll(".product-card__img-link-overlay")[i].href;
    dataJson.image = document.querySelectorAll(".product-card  .product-card__body > figure > .product-card__img-link-overlay > div > div > img ")[i].src;
    dataJson.price = document.querySelectorAll(".product-card  .product-card__body > figure > .product-card__info > .product-card__animation_wrapper > .product-card__price-wrapper > .product-card__price > .product-price__wrapper > .product-price ")[i].innerHTML;
    dataJson.dateCreate = todayFormat;
    items.push(dataJson)
  }
  return items;
}
async function scrapeInfiniteScrollItems(
  page,
  extractItems,
  itemTargetCount,
  scrollDelay = 1000,
) {
  let items = [];
  try {
    let previousHeight;
    while (items.length < itemTargetCount) {
      console.log(items.length + "-" + itemTargetCount);
      items = await page.evaluate(extractItems);
      previousHeight = await page.evaluate('document.body.scrollHeight');
      await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
      await page.waitForFunction(`document.body.scrollHeight > ${previousHeight}`);
      await page.waitFor(scrollDelay);
    }
  } catch (e) { }
  return items.splice(0, itemTargetCount);
}
(async () => {
  const browser = await puppeteer.launch();
  console.log('Browser openned');
  const page = await browser.newPage();
  // const baseURL = "https://www.nike.com";
  // const url = `https://www.nike.com/vn/w/mens-shoes-nik1zy7ok`;
  // const urlDetail = `${baseURL}/t`;
  await page.setDefaultNavigationTimeout(0);
  await page.goto("https://www.nike.com/vn/w/mens-shoes-nik1zy7ok", {
    waitUntil: 'networkidle2',
  });
  console.log('Page loaded');
  page.setViewport({ width: 1280, height: 926 });
  const items = await scrapeInfiniteScrollItems(page, extractItemsProduct, 70);
  const dataCategory = await page.evaluate(() => {
    let categories = [];
    let array = document.querySelectorAll(".pre-desktop-menu .pre-desktop-menu-item");
    // .job-item .row .col-3 .logo-border a img
    for (let i = 0; i < array.length; i++) {
      let dataJson = {};
      dataJson.id = i < 10 ? "C00" + i : "C0" + i;
      dataJson.name = document.querySelectorAll(".pre-desktop-menu .pre-desktop-menu-item > a")[i].innerHTML;
      categories.push(dataJson)
    }
    return categories;
  });
  // console.log(dataCategory);
  // page.on('console', async (msg) => {
  //   const msgArgs = msg.args();
  //   for (let i = 0; i < msgArgs.length; ++i) {
  //     console.log(await msgArgs[i].jsonValue());
  //   }
  // });
  await browser.close();
  for (let i = 0; i < items.length; i++) {
    const browser = await puppeteer.launch();
    console.log('Browser openned detail');
    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(0);
    await page.goto(items[i].description, {
      waitUntil: 'networkidle2',
    });
    console.log('Page  loaded detail');
    const description = await page.evaluate(() => {
      return document.querySelector(".description-preview > p").innerHTML;
    })
    items[i].description = description;
    console.log("detail 123");
    console.log(items[i]);
    await browser.close()
  }
  console.log("done");
  //   return products;
  // });
  console.log(items);

  fs.writeFileSync('data.json', JSON.stringify({ products: items, categories: dataCategory }));
  convertJsonXML();
  console.log("close app");

})();
const puppeteer = require('puppeteer');
const path = require('path');
// '..' since we're in the test/ subdirectory; learner is supposed to have src/index.html
const pagePath = 'file://' + path.resolve(__dirname, '../src/index.html');

const hs = require('hs-test-web');

const sleep = (ms) => new Promise(res => setTimeout(res, ms));

async function stageTest() {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args:['--start-maximized']
    });

    const page = await browser.newPage();
    await page.goto(pagePath);

    page.on('console', msg => console.log(msg.text()));

    await sleep(1000);

    let result = await hs.testPage(page,
        //test1
        /*
        1)Checks existence of h1 element on the page.
        2)Checks that there is text inside of h1
        3)Checks that font !== serif | Times New Roman
        * */
        () => {
            let h1 = document.body.getElementsByTagName("h1");

            if (h1.length === 0) return hs.wrong("There should be h1 element on the page.");
            if (h1.length > 1) return hs.wrong("There should be only one h1 element on the page.");
            if (!h1[0].innerText) return hs.wrong("The h1 element should contain text.");

            let font = window.getComputedStyle(h1[0]).fontFamily;
            if (font === '"serif"' || font === '"Times New Roman"') return  hs.wrong("The text inside the h1 element should have a font different from 'serif' and 'Times New Roman'.");

            return hs.correct()
        },
        //#test2
        /*
        1) Finds element with 9 divs
        2) Checks if it has CSS property display: flex/ grid
         */
        () => {
            let divs = document.body.getElementsByTagName("div");

            for (let div of divs) {
                if (div.children.length === 9) {
                    const display = window.getComputedStyle(div).display;
                    if (display && (display.toLowerCase() === 'flex' || display.toLowerCase() === 'grid')) {
                        return hs.correct();
                    } else {
                        return hs.wrong("The CSS property display: flex or display: grid should be set to the element with 9 div elements inside.");
                    }
                }
            }

            return hs.wrong("There should be an element with 9 div elements inside.");
        },
        //#test3
        /*
        1)Checks if all text on the cards in p element
        2)Checks if it has font !== serif | Times New Roman
        */
        () => {
            let divs = document.body.getElementsByTagName("div");
            let k = 0;
            for (let div of divs) {
                if (div.children.length === 9) {
                    for (let card of Array.from(div.children)) {
                        if (card.children[0] && card.children[0].tagName.toLowerCase() === 'p') {
                            let font = window.getComputedStyle(div.children[0]).fontFamily;
                            if (font === '"serif"' || font === '"Times New Roman"') {
                                return hs.wrong("Text on cards should have font different from 'serif' and 'Times New Roman'");
                            } else {
                                k++;
                            }
                        } else {
                            return hs.wrong("The structure should be the same as given in the step and all text on the cards should be in 'p' element");
                        }
                    }
                }
            }

            return k !== 9 ? hs.wrong("9 div elements should contain p element.") : hs.correct();
        },
        //#test4
        /*
        1)Checks that cards form a table 3x3
         */
        () => {
            let divs = document.body.getElementsByTagName("div");
            let cardsH = [];
            let cardsL = [];
            for (let div of divs) {
                if (div.children && div.children.length === 9) {
                    for (let cardDiv of div.children) {
                        let styles = window.getComputedStyle(cardDiv);
                        if (styles.width === styles.height) {
                            let left = cardDiv.getBoundingClientRect().left;
                            let top = cardDiv.getBoundingClientRect().top;
                            if (!cardsH.includes(top)) {
                                cardsH.push(top);
                            }
                            if (!cardsL.includes(left)) {
                                cardsL.push(left);
                            }

                            let background = window.getComputedStyle(cardDiv).backgroundColor || window.getComputedStyle(cardDiv).backgroundImage
                            if (!background) return hs.wrong("Each card should have a background.")
                        }
                    }
                }
            }

            return cardsH.length === 3 && cardsL.length === 3 ? hs.correct() :
                hs.wrong("The cards should form a table 3x3 and each of them should have equal width and height.")
        },
        //#test5
        /*
        1)Checks the background of the element, which contains h1 and div with 9 divs
         */
        () => {
            let divs = document.body.getElementsByTagName("div");
            for (let div of divs) {
                let childrenElements = Array.from(div.children)
                if (childrenElements.find(el => el.tagName.toLowerCase() === "h1")) {
                    if (window.getComputedStyle(div).backgroundColor !== 'rgba(0, 0, 0, 0)' ||
                        window.getComputedStyle(div).backgroundImage !== 'none') {

                        return hs.correct();
                    }
                }
            }

            let bodyStyles = window.getComputedStyle(document.body);
            if (bodyStyles.backgroundColor !== 'rgba(0, 0, 0, 0)' ||
                bodyStyles.backgroundImage !== 'none') {

                return hs.correct();
            }

            return hs.wrong("The element that contains header and cards should have a background.\n" +
                "Please, make sure you set a background as CSS property.");
        }
    )

    await browser.close();
    return result;
}

jest.setTimeout(30000);
test("Test stage", async () => {
        let result = await stageTest();
        if (result['type'] === 'wrong') {
            fail(result['message']);
        }
    }
);

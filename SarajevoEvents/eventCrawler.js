const { Builder, By, until } = require('selenium-webdriver');
require('chromedriver');
const FileSystem = require('fs');

(async function Crawler() {
    let driver = await new Builder().forBrowser('chrome').build();
    let list = [];

    try {
        await driver.get('https://www.sarajevoin.ba/event');
        let elements = await driver.findElements(By.className('Event_singleEvent__KOwmb'));
      
      console.log("elements:",elements.length)
        for (let i = 0; i < elements.length; i++) {
            try{
                let events = {};

                let elementsPostRefresh = []
                if(i!==0){
                    elementsPostRefresh = await driver.findElements(By.className('Event_singleEvent__KOwmb'))
                    let counter = 0
                    while (elements.length !== elementsPostRefresh.length && counter < 10000) {
                        counter++;
                    }
                    elements = elementsPostRefresh
                }

                const titleElement = await elements[i].findElement(By.className('Event_selectedEventText__tLPSX'));
                const title = await titleElement.getText();
                events = { ...events, title };
                driver.executeScript("arguments[0].scrollIntoView(true);", titleElement)

                const imageElement = await elements[i].findElement(By.css('img'));
                const srcValue = await imageElement.getAttribute('src');
                events = { ...events, image: [srcValue] };

                const locationElement = await elements[i].findElement(By.className('Event_single-event-location-name___E_K8'))
                const locationValue = await locationElement.getText();
                events = {...events, locationValue}
                
                const timeElement = await elements[i].findElement(By.className('Event_single-event-time__NrhNZ'))
                const timeValue = await timeElement.getText();
                events = {...events,timeValue}

                elements[i].click()
                await driver.sleep(2000)
                
                await driver.wait(until.elementLocated(By.className('Event_modal-information-price__qzKsX css-1ngehnn')), 5000);
                
                const priceElement = await driver.findElement(By.className('Event_modal-information-price__qzKsX css-1ngehnn'))
                const priceValue = await priceElement.getText();
                console.log("line 44")
                events = {...events,priceValue}
                const descriptionElement = await driver.findElement(By.className('chakra-text Event_modal-body-text__jHthh css-0'))
                const descriptionValue = await descriptionElement.getText();
                
                events = {...events,descriptionValue}
                console.log('price',priceValue)
                console.log('desc',descriptionValue)
                console.log("line 52")
                
                
                
                const back = await driver.findElement(By.className('Event_modal-close-button__uDSCF css-1a8mfs8')).click()
                list.push(events);
                await driver.sleep(1500)
            
            }catch(error){     
                console.log(i)
                throw error;
            }
        }
        

        // Writing json file with collected data
        const jsonContent = JSON.stringify(list);
        FileSystem.writeFile('./sarajevoEventsData.json', jsonContent, 'utf8', function (err) {
            if (err) {
                //console.log('An error occurred while writing JSON Object to File.');
                return //console.log(err);
            }
            //console.log('JSON file has been saved!');
        });
    } finally {
        await driver.quit();
    }
})();
